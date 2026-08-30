import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '../lib/api';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
  label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  className = '',
  label = 'Profile Image',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // We use standard fetch or api instance to hit the upload endpoint
      // Assuming 'api' is configured with interceptors that attach the token
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      if (data.url) {
        onChange(data.url);
        toast.success('Image uploaded successfully');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed
          transition-all duration-200 flex flex-col items-center justify-center
          ${value ? 'border-transparent bg-slate-50' : 'border-slate-300 hover:border-primary/50 hover:bg-primary/5'}
          ${isUploading ? 'opacity-70 pointer-events-none' : ''}
          w-full aspect-[4/3] sm:w-48 sm:aspect-square
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        {value ? (
          <>
            <img 
              src={value} 
              alt="Uploaded" 
              className="absolute inset-0 w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white font-medium flex items-center gap-2">
                <Upload size={18} /> Change
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-slate-700 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
              {isUploading ? (
                <Loader2 size={24} className="text-primary animate-spin" />
              ) : (
                <ImageIcon size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                {isUploading ? 'Uploading...' : 'Click to upload'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
        )}

        {/* Uploading Overlay */}
        {isUploading && value && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
            <Loader2 size={28} className="text-primary animate-spin mb-2" />
            <span className="text-sm font-medium text-slate-700">Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
};
