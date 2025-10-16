import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { CameraOffIcon } from './icons/CameraOffIcon';

const CameraView: React.FC<{
  onCapture: (file: File) => void;
  onClose: () => void;
}> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 1280, height: 720 },
          audio: false,
        });
        activeStream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
        setError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        let message = "An unexpected error occurred while trying to access the camera.";
        if (err instanceof DOMException) {
          switch (err.name) {
            case 'NotAllowedError':
              message = "Camera access was denied. Please allow camera permission in your browser's site settings and try again.";
              break;
            case 'NotFoundError':
              message = "No camera found on this device. Please make sure a camera is connected and enabled.";
              break;
            case 'NotReadableError':
              message = "The camera could not be started. It might be in use by another app, or there could be a hardware error.";
              break;
            case 'OverconstrainedError':
              message = "The available camera does not support the required settings.";
              break;
            default:
              message = "Could not access the camera. Please check permissions and ensure it's not in use by another application.";
          }
        }
        setError(message);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      // Flip the image horizontally to match the mirrored preview
      context.translate(videoWidth, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, videoWidth, videoHeight);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.95);
  }, [stream, onCapture]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-neutral-900 rounded-2xl p-4 shadow-xl border border-neutral-700 w-full max-w-2xl">
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <CameraOffIcon className="w-16 h-16 mb-4 text-neutral-500" />
              <p className="font-semibold text-lg text-neutral-200 mb-2">Camera Error</p>
              <p className="text-sm text-neutral-400 max-w-sm">{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-60 h-80 border-2 border-white/30 border-dashed rounded-full opacity-70"></div>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex justify-between items-center w-full max-w-xs mx-auto mt-6">
           <div className="w-16"></div> {/* Spacer to center capture button */}
           <button 
             onClick={handleCapture}
             disabled={!stream || !!error}
             className="w-16 h-16 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30 hover:ring-white/50 transition disabled:bg-neutral-600 disabled:cursor-not-allowed"
             aria-label="Capture photo"
           >
             <div className="w-14 h-14 rounded-full bg-white border-2 border-neutral-900"></div>
           </button>
           <button onClick={onClose} className="w-16 h-16 flex items-center justify-center text-neutral-200 hover:bg-neutral-700 rounded-full transition-colors" aria-label="Close camera">
             <CloseIcon className="w-8 h-8" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default CameraView;