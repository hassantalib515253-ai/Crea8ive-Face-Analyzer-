import React, { useState, useEffect } from 'react';

const messages = [
  "Detecting facial landmarks...",
  "Calculating proportions...",
  "Comparing to the Golden Ratio...",
  "Generating your aesthetic score...",
  "Finalizing your report...",
];

const Loader: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 animate-fadeIn">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-neutral-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-beige rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-semibold text-beige mb-2">Analyzing your Fibonacci proportions...</h2>
            <p className="text-silver transition-opacity duration-500">{messages[messageIndex]}</p>
        </div>
    );
};

export default Loader;
