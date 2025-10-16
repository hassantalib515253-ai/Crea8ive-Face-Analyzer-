import React, { useRef, useState, useEffect } from 'react';
import { ImageFile } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { CameraIcon } from './icons/CameraIcon';
import CameraView from './CameraView';

interface ImageUploaderProps {
  image: ImageFile | null;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;
  onAnalyze: () => void;
  isAnalyzeDisabled: boolean;
}

const UploadBox: React.FC<{
  image: ImageFile | null;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;
}> = ({ image, onImageUpload, onRemoveImage }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (image?.file) {
      const url = URL.createObjectURL(image.file);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [image]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleBoxClick = () => {
    if (!image) {
      inputRef.current?.click();
    }
  };
  
  const handleBoxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!image && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      className={`w-full max-w-md mx-auto h-80 border-2 border-dashed border-neutral-700 rounded-xl flex items-center justify-center relative bg-neutral-900 overflow-hidden group ${!image ? 'hover:border-beige transition-colors duration-300 cursor-pointer' : ''}`}
      onClick={handleBoxClick}
      onKeyDown={handleBoxKeyDown}
      role="button"
      aria-label={image ? 'Image preview' : 'Upload a photo'}
      tabIndex={image ? -1 : 0}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/jpg"
      />
      {image && previewUrl ? (
        <>
          <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveImage();
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label={`Remove image`}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </>
      ) : (
        <div className="text-center text-neutral-400 pointer-events-none">
          <UploadIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold">Upload Front or Side View Photo</p>
          <p className="text-xs">JPG or PNG</p>
        </div>
      )}
    </div>
  );
};

const ImageUploader: React.FC<ImageUploaderProps> = ({
  image,
  onImageUpload,
  onRemoveImage,
  onAnalyze,
  isAnalyzeDisabled,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleCapture = (file: File) => {
    onImageUpload(file);
    setIsCameraOpen(false);
  };

  return (
    <div className="w-full animate-fadeIn">
      {isCameraOpen && <CameraView onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
      
      <div className="mb-6">
        <UploadBox image={image} onImageUpload={onImageUpload} onRemoveImage={onRemoveImage} />
      </div>

      {!image && (
        <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-4 max-w-md mx-auto">
                <div className="flex-grow border-t border-neutral-700"></div>
                <span className="text-neutral-500 text-sm font-medium">OR</span>
                <div className="flex-grow border-t border-neutral-700"></div>
            </div>
            <button
                onClick={() => setIsCameraOpen(true)}
                className="inline-flex items-center justify-center px-5 py-2.5 border border-neutral-600 text-base font-medium rounded-lg text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
                <CameraIcon className="w-5 h-5 mr-3" />
                Use Camera
            </button>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzeDisabled}
          className="px-10 py-3 bg-beige text-neutral-950 font-bold rounded-lg hover:bg-opacity-80 transition-all duration-300 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transform hover:scale-105"
        >
          Analyze Face
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;