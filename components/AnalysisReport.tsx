import React, { useRef, useState, useEffect } from 'react';
import { AnalysisResult, ImageFile } from '../types';
import { generatePdf } from '../utils/pdfGenerator';
import { ShareIcon } from './icons/ShareIcon';

interface AnalysisReportProps {
  result: AnalysisResult;
  image: ImageFile | null;
  onReset: () => void;
}

const ProgressBar: React.FC<{ score: number }> = ({ score }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="w-full bg-neutral-700 rounded-full h-2.5">
      <div
        className="bg-beige h-2.5 rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%` }}
      ></div>
    </div>
  );
};

const AnnotatedImage: React.FC<{
  imageSrc: string;
  lines: AnalysisResult['overlayLines'];
}> = ({ imageSrc, lines }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const scale = containerWidth / img.naturalWidth;
        setDimensions({ width: containerWidth, height: img.naturalHeight * scale });
      }
    };
  }, [imageSrc]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden">
      <img src={imageSrc} alt="Analyzed face" className="w-full h-auto" />
      <svg
        className="absolute top-0 left-0"
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {lines.map((line, index) => (
          <line
            key={index}
            x1={line.x1 * dimensions.width}
            y1={line.y1 * dimensions.height}
            x2={line.x2 * dimensions.width}
            y2={line.y2 * dimensions.height}
            stroke="rgba(220, 211, 196, 0.8)"
            strokeWidth="2"
            strokeDasharray="4"
          />
        ))}
      </svg>
    </div>
  );
};


const AnalysisReport: React.FC<AnalysisReportProps> = ({ result, image, onReset }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [shareText, setShareText] = useState('Share');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { overallScore, feedback, featureScores, detailedScores, overlayLines } = result;

  useEffect(() => {
    if (image?.file) {
      const url = URL.createObjectURL(image.file);
      setImageUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [image]);

  const handleDownload = async () => {
    if (reportRef.current) {
        setIsDownloading(true);
        // Ensure details are visible for PDF capture if they were toggled on
        const shouldShowDetailsForPdf = showDetails;
        if (!showDetails) setShowDetails(true);

        // Allow DOM to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await generatePdf(reportRef.current);

        if (!shouldShowDetailsForPdf) setShowDetails(false);
        setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'My Fibonacci Face Analysis',
      text: `I scored ${overallScore}% on the Golden Ratio with the Fibonacci Face Analyzer! ✨ See how you measure up.`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareText('Copied!');
        setTimeout(() => setShareText('Share'), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        setShareText('Failed!');
        setTimeout(() => setShareText('Share'), 2000);
      }
    }
  };

  return (
    <div className="w-full animate-fadeIn">
      <div ref={reportRef} className="bg-neutral-800 p-4 sm:p-8 rounded-lg mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {imageUrl && (
            <div className="w-full">
              <AnnotatedImage imageSrc={imageUrl} lines={overlayLines} />
            </div>
          )}

          <div className={`w-full ${!imageUrl ? 'lg:col-span-2' : ''}`}>
            <h2 className="text-2xl font-bold text-beige mb-4">Analysis Results</h2>
            <div className="text-center bg-neutral-900 p-6 rounded-lg mb-6">
              <p className="text-silver text-sm">Overall Golden Ratio Score</p>
              <p className="text-6xl font-bold text-beige my-2">{overallScore}%</p>
            </div>

            <div className="space-y-4 mb-6">
              {featureScores.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="font-medium text-neutral-200">{item.feature}</span>
                    <span className="font-semibold text-beige">{item.score}%</span>
                  </div>
                  <ProgressBar score={item.score} />
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-silver mb-2">AI Feedback</h3>
              <p className="text-neutral-300 text-sm leading-relaxed italic">
                “{feedback}”
              </p>
            </div>
             <button onClick={() => setShowDetails(!showDetails)} className="text-beige text-sm font-semibold mb-4 hover:underline">
                {showDetails ? 'Hide' : 'Show'} Detailed Analysis
            </button>
            {showDetails && (
                 <div className="bg-neutral-900 p-4 rounded-lg animate-fadeIn">
                    <h4 className="text-md font-semibold text-silver mb-3">Detailed Ratios</h4>
                    <div className="text-xs space-y-2">
                        <div className="grid grid-cols-3 gap-2 font-bold text-neutral-400 border-b border-neutral-700 pb-1">
                            <span>Ratio Name</span>
                            <span className="text-center">Value</span>
                            <span className="text-right">Deviation</span>
                        </div>
                        {detailedScores.map((item, index) => (
                            <div key={index} className="grid grid-cols-3 gap-2 text-neutral-200 items-center">
                                <span>{item.ratioName}</span>
                                <span className="text-center font-mono bg-neutral-800 rounded px-1 py-0.5">{item.value}</span>
                                <span className={`text-right font-semibold ${item.deviation <= 5 ? 'text-green-400' : item.deviation <= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {item.deviation}%
                                </span>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full sm:w-auto px-6 py-3 bg-silver text-neutral-950 font-bold rounded-lg hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105 disabled:bg-neutral-600 disabled:cursor-wait"
        >
          {isDownloading ? 'Downloading...' : 'Download Report'}
        </button>
        <button
          onClick={handleShare}
          className="w-full sm:w-auto px-6 py-3 bg-neutral-700 text-white font-bold rounded-lg hover:bg-neutral-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
        >
          {shareText === 'Share' && <ShareIcon className="w-5 h-5" />}
          {shareText}
        </button>
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-3 bg-neutral-700 text-white font-bold rounded-lg hover:bg-neutral-600 transition-all duration-300"
        >
          Analyze Another
        </button>
      </div>
    </div>
  );
};

export default AnalysisReport;