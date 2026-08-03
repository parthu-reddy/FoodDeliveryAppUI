export const DB_NAME = 'ChatOfflineDB';
export const DB_VERSION = 1;

export interface AudioChunk {
  id?: number;
  sessionId: string;
  chunk: Blob;
  order: number;
}

export interface PendingUpload {
  sessionId: string;
  status: 'recording' | 'pending' | 'uploading';
  mimeType: string;
  token: string; // To authenticate background upload
  timestamp: number;
}

// Open or create the database
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store for individual audio chunks
      if (!db.objectStoreNames.contains('chunks')) {
        const chunkStore = db.createObjectStore('chunks', { keyPath: 'id', autoIncrement: true });
        chunkStore.createIndex('sessionId', 'sessionId', { unique: false });
      }

      // Store for upload metadata
      if (!db.objectStoreNames.contains('pending_uploads')) {
        db.createObjectStore('pending_uploads', { keyPath: 'sessionId' });
      }
    };
  });
};

// Add a single audio chunk to the database
export const saveChunk = async (sessionId: string, chunk: Blob, order: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chunks', 'readwrite');
    const store = transaction.objectStore('chunks');
    const request = store.add({ sessionId, chunk, order });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Retrieve all chunks for a session
export const getChunks = async (sessionId: string): Promise<Blob[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chunks', 'readonly');
    const store = transaction.objectStore('chunks');
    const index = store.index('sessionId');
    const request = index.getAll(sessionId);

    request.onsuccess = () => {
      const chunks = request.result as AudioChunk[];
      // Sort by order to ensure audio isn't garbled
      chunks.sort((a, b) => a.order - b.order);
      resolve(chunks.map(c => c.chunk));
    };
    request.onerror = () => reject(request.error);
  });
};

// Save upload metadata
export const savePendingUpload = async (upload: PendingUpload): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending_uploads', 'readwrite');
    const store = transaction.objectStore('pending_uploads');
    const request = store.put(upload);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Get pending uploads
export const getPendingUploads = async (): Promise<PendingUpload[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending_uploads', 'readonly');
    const store = transaction.objectStore('pending_uploads');
    const request = store.getAll();

    request.onsuccess = () => {
      const uploads = request.result as PendingUpload[];
      resolve(uploads.filter(u => u.status === 'pending'));
    };
    request.onerror = () => reject(request.error);
  });
};

// Delete all data for a session after successful upload
export const clearSessionData = async (sessionId: string): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chunks', 'pending_uploads'], 'readwrite');
    
    // 1. Delete from pending_uploads
    transaction.objectStore('pending_uploads').delete(sessionId);
    
    // 2. Delete all chunks
    const chunkStore = transaction.objectStore('chunks');
    const index = chunkStore.index('sessionId');
    const request = index.openCursor(IDBKeyRange.only(sessionId));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Clean up orphaned chunks (e.g. if the browser crashed mid-call without completing)
export const cleanOrphanedChunks = async (activeSessionId?: string): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chunks', 'pending_uploads'], 'readwrite');
    const chunkStore = transaction.objectStore('chunks');
    const pendingStore = transaction.objectStore('pending_uploads');
    
    // 1. Get all pending session IDs
    const pendingRequest = pendingStore.getAllKeys();
    
    pendingRequest.onsuccess = () => {
      const pendingSessionIds = new Set(pendingRequest.result as string[]);
      if (activeSessionId) {
        pendingSessionIds.add(activeSessionId);
      }
      
      // 2. Iterate through all chunks and delete if sessionId not in pendingSessionIds
      const cursorRequest = chunkStore.openCursor();
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          const chunk = cursor.value as AudioChunk;
          if (!pendingSessionIds.has(chunk.sessionId)) {
             cursor.delete();
          }
          cursor.continue();
        } else {
          resolve(); // Finished
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    };
    pendingRequest.onerror = () => reject(pendingRequest.error);
  });
};
