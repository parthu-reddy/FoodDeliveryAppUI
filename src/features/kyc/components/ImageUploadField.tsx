import { restaurantApi } from "@/lib/zodiosClients";
import { compressImageNative } from "@/utils/imageCompression";
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
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
      
      const res = await restaurantApi.imageUpload.post('/api/v1/images/upload', formData as unknown as { file: File }, { queries: { folderId, imageType } });
      if (res && res.data) {
        onChange(res.data);
      } else {
        throw new Error("Failed to get public URL");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to upload file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processFile(file);
  };

  return (
    <div className="w-full">
      <div className="flex items-center space-x-3">
        <div 
          onClick={() => {
            if (!loading) {
              setError('');
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed ${
            isDragging ? 'border-rose-500 bg-rose-500/10' :
            error ? 'border-red-500/50 bg-red-500/5' 
            : value ? 'border-emerald-500/30 bg-emerald-500/10' 
            : 'border-rose-500/30 bg-white/10 dark:bg-slate-900/10'
          } backdrop-blur-md cursor-pointer hover:bg-white/20 dark:hover:bg-slate-900/20 transition-all`}
        >
          {loading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Uploading...</span>
            </div>
          ) : value ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-emerald-500/30 shadow-sm">
                <img src={value} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 text-center px-4 truncate w-full">Click to replace</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-rose-500" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                <span className="font-bold text-rose-600 dark:text-rose-400">Click to upload</span> or drag and drop
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{placeholder} (Max: 20MB)</span>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {error && (
        <div className="mt-2 text-xs font-medium text-red-500 flex items-center">
          <Loader2 className="w-3 h-3 mr-1 opacity-0" /> {error}
        </div>
      )}
    </div>
  );
}
