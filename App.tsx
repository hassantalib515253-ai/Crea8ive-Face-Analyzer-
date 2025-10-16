import React, { useState, useCallback } from 'react';
import { AnalysisResult, ImageFile, AppState } from './types';
import { analyzeFace } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import AnalysisReport from './components/AnalysisReport';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [image, setImage] = useState<ImageFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((file: File) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!acceptedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a photo in JPG or PNG format.');
      setAppState(AppState.Error);
      return;
    }

    setError(null);
    setAppState(AppState.Idle);
    setImage({ file });
  }, []);

  const handleRemoveImage = () => {
    setImage(null);
  };

  const handleAnalyze = useCallback(async () => {
    if (!image) {
      setError('Please upload an image to analyze.');
      return;
    }

    setAppState(AppState.Loading);
    setError(null);

    try {
      const result = await analyzeFace(image);
      if (result.error && result.errorMessage) {
        setError(result.errorMessage);
        setAppState(AppState.Error);
      } else {
        setAnalysisResult(result);
        setAppState(AppState.Result);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(`Unable to analyze. Please re-upload a clear image. Details: ${errorMessage}`);
      setAppState(AppState.Error);
    }
  }, [image]);
  
  const handleReset = () => {
    setImage(null);
    setAnalysisResult(null);
    setAppState(AppState.Idle);
    setError(null);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.Loading:
        return <Loader />;
      case AppState.Result:
        return analysisResult && <AnalysisReport result={analysisResult} image={image} onReset={handleReset} />;
      case AppState.Error:
         return (
          <div className="text-center text-red-400 animate-fadeIn">
            <p className="mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-beige text-neutral-950 font-semibold rounded-lg hover:bg-opacity-80 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case AppState.Idle:
      default:
        return (
          <ImageUploader
            image={image}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            onAnalyze={handleAnalyze}
            isAnalyzeDisabled={!image}
          />
        );
    }
  };

  return (
    <div className="bg-neutral-950 text-neutral-200 min-h-screen font-sans flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-beige tracking-tight">
            Fibonacci Face Analyzer
          </h1>
          <p className="text-silver mt-2 text-lg">
            Discover the golden ratio in your facial features.
          </p>
        </header>
        <div className="bg-neutral-800/50 backdrop-blur-sm p-6 sm:p-10 rounded-2xl shadow-2xl border border-neutral-700 min-h-[400px] flex items-center justify-center">
          {renderContent()}
        </div>
        <footer className="text-center mt-8 text-neutral-700 text-sm">
            <p>Powered by Gemini AI. For entertainment purposes only.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;