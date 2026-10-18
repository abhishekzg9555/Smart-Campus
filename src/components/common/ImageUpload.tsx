import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { fileToDataUrl, compressImage } from '../../services/storageService';

interface ImageUploadProps {
  onImageSelected: (file: File | null, dataUrl: string | null) => void;
  previewUrl: string | null;
  label?: string;
  required?: boolean;
  helperText?: string;
  categoryHint?: string;
}

const SAMPLE_CAMPUS_ISSUES = [
  {
    name: 'Electrical Defect',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description: 'Broken switchboard & exposed wiring',
  },
  {
    name: 'Plumbing Leak',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    description: 'Pipe leaking in washroom',
  },
  {
    name: 'Broken Furniture',
    url: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80',
    description: 'Damaged classroom bench & desk',
  },
  {
    name: 'Cleanliness Issue',
    url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
    description: 'Corridor & trash bins unattended',
  },
  {
    name: 'Door & Fixture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    description: 'Damaged door lock / handle',
  },
];

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  previewUrl,
  label = 'Upload Photograph',
  required = true,
  helperText = 'Attach clear photo of the broken or damaged infrastructure (Max 15MB, JPG/PNG/WEBP)',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeObjectUrlRef = useRef<string | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size exceeds 20MB limit. Please choose a smaller file.');
      return;
    }

    setError(null);

    // 1. INSTANT PREVIEW (0ms delay): Create fast temporary ObjectURL
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
    }
    const instantPreview = URL.createObjectURL(file);
    activeObjectUrlRef.current = instantPreview;
    onImageSelected(file, instantPreview);

    // 2. High-speed non-blocking background compression
    setIsProcessing(true);
    try {
      const compressedBlob = await compressImage(file, 900, 0.72);
      const dataUrl = await fileToDataUrl(compressedBlob);
      // Replace with lightweight compressed dataUrl
      onImageSelected(file, dataUrl);
    } catch {
      // Keep instant preview on any error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
    onImageSelected(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectSample = (sampleUrl: string) => {
    setError(null);
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
    // Instant sample preview assignment (0ms latency)
    onImageSelected(null, sampleUrl);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Remove Photo
          </button>
        )}
      </div>

      {previewUrl ? (
        <div className="relative rounded-xl border border-slate-300 overflow-hidden bg-slate-900 group aspect-video sm:aspect-2/1 max-h-72">
          <img
            src={previewUrl}
            alt="Uploaded Preview"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-100 shadow-md cursor-pointer"
            >
              Replace Photo
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 shadow-md cursor-pointer"
            >
              Delete
            </button>
          </div>
          <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[11px] px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
            {isProcessing ? (
              <>
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Photo ready</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/80 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-semibold text-slate-800">
            Click to upload or drag and drop photo
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{helperText}</p>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Or click a quick sample test photo:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SAMPLE_CAMPUS_ISSUES.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSample(sample.url);
                  }}
                  className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors font-medium cursor-pointer"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
