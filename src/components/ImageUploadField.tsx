import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { apiPostFormData } from '../lib/apiClient';
import { compressImageNative } from '../utils/imageCompression';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  folderId: string;
  placeholder?: string;
  imageType?: string;
}

export default function ImageUploadField({ value, onChange, folderId, placeholder = "Upload Image", imageType = "default" }: ImageUploadFieldProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 20 * 1024 * 1024) {
      setError('File is too large to process. Maximum allowed size is 20MB.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const targetSizeKb = imageType === 'menu' ? 4 : 40;
      const maxWidth = imageType === 'menu' ? 400 : 1200;
      const compressedFile = await compressImageNative(file, targetSizeKb, maxWidth);

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('folderId', folderId);
      formData.append('imageType', imageType);
      
      const res = await apiPostFormData('/api/v1/images/upload', formData);
      if (res && res.data) {
        onChange(res.data);
      } else {
        throw new Error("Failed to get public URL");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md bg-white">
        <div className="flex items-center px-3 rounded-l-md border-r border-gray-300 bg-gray-50 text-gray-500">
          <Upload className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">File</span>
        </div>
        <div className="flex-1 flex items-center px-3 py-1.5">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500 ml-2" />}
        </div>
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      {value && !loading && !error && (
        <div className="mt-2 text-sm text-green-600 flex items-center">
          <ImageIcon className="h-4 w-4 mr-1" /> Uploaded successfully
        </div>
      )}
    </div>
  );
}
