import { ImagePlus, Send } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

interface ChatInputProps {
  isConnected: boolean;
  isLoading: boolean;
  isImageUploadDisabled: boolean;
  uploadedImageCount: number;
  onSendMessage: (text: string) => void;
  onTyping: () => void;
  onImageUpload: (file: File) => Promise<void>;
}

export const ChatInput: React.FC<ChatInputProps> = React.memo(({
  isConnected,
  isLoading,
  isImageUploadDisabled,
  uploadedImageCount,
  onSendMessage,
  onTyping,
  onImageUpload,
}) => {
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Throttle typing indicators
  const throttledOnTyping = useCallback(
    // Simple custom throttle instead of lodash to avoid dependency issues
    (() => {
      let lastCall = 0;
      return () => {
        const now = Date.now();
        if (now - lastCall >= 1000) {
          lastCall = now;
          onTyping();
        }
      };
    })(),
    [onTyping]
  );

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !isConnected || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear the input
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (uploadedImageCount >= 4) {
      alert("You have reached the maximum limit of 4 images for this chat session.");
      return;
    }

    await onImageUpload(file);
  };

  return (
    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 shrink-0">
      <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isImageUploadDisabled}
          title={uploadedImageCount >= 4 ? "Maximum 4 images allowed per session" : "Upload Image"}
          className="p-1.5 text-gray-500 hover:text-orange-600 transition-colors disabled:opacity-50"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        
        <textarea
          value={inputText}
          onChange={(e) => { 
            setInputText(e.target.value); 
            throttledOnTyping(); 
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 128)}px`; // 128px is 8rem (max-h-32)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
              // Reset height
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
            }
          }}
          placeholder="Type a message..."
          className="w-full bg-transparent p-3 outline-none resize-none max-h-32 min-h-[44px]"
          rows={1}
          disabled={!isConnected || isLoading}
          style={{ overflowY: inputText.split('\n').length > 4 ? 'auto' : 'hidden' }}
        />
        <button 
          type="submit"
          disabled={!inputText.trim() || !isConnected || isLoading}
          className={`p-1.5 rounded-full transition-colors ${
            inputText.trim() && isConnected && !isLoading
              ? 'bg-orange-600 text-white hover:bg-orange-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
});
