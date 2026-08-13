export const compressImageNative = async (
  file: File, 
  targetSizeKb: number, 
  maxWidth: number
): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Prevent memory leak
      
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const targetSizeBytes = targetSizeKb * 1024;
      let minQ = 0.0;
      let maxQ = 1.0;
      let bestFile = file;
      let attempts = 0;
      const maxAttempts = 7;
      
      const tryQuality = (q: number) => {
        canvas.toBlob((blob) => {
          if (!blob) return resolve(bestFile);
          
          const newFile = new File([blob], file.name.replace(/\.[^/.]+₹/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          if (newFile.size <= targetSizeBytes) {
            bestFile = newFile;
            minQ = q; // Try higher quality
          } else {
            maxQ = q; // Need lower quality
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            tryQuality((minQ + maxQ) / 2);
          } else {
            resolve(bestFile.size <= targetSizeBytes ? bestFile : newFile);
          }
        }, 'image/jpeg', q);
      };
      
      // Start binary search for optimal quality at 0.7
      tryQuality(0.7);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl); // Prevent memory leak
      resolve(file);
    };

    img.src = objectUrl;
  });
};
