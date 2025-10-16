import { GoogleGenAI, Type, Part } from "@google/genai";
import { ImageFile, AnalysisResult } from '../types';

const fileToGenerativePart = async (imageFile: ImageFile): Promise<Part> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
            inlineData: {
                data: base64Data,
                mimeType: imageFile.file.type,
            },
        });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(imageFile.file);
  });
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        error: { 
            type: Type.STRING, 
            description: "An error code if validation fails (e.g., 'MULTIPLE_FACES', 'LOW_QUALITY'). Omit if successful."
        },
        errorMessage: {
            type: Type.STRING,
            description: "A user-facing error message if validation fails. Omit if successful."
        },
        overallScore: { 
            type: Type.INTEGER, 
            description: "A single overall score from 0 to 100. Provide 0 if validation fails." 
        },
        feedback: { 
            type: Type.STRING, 
            description: "A short, natural language summary of the analysis (2-3 sentences). Provide an empty string if validation fails." 
        },
        featureScores: {
            type: Type.ARRAY,
            description: "An array of scores for specific facial features. Must include 'Facial Symmetry', 'Eye Spacing', 'Nose to Lip Ratio', and 'Forehead Height to Face Width'. Provide an empty array if validation fails.",
            items: {
                type: Type.OBJECT,
                properties: {
                    feature: { type: Type.STRING, description: "Name of the facial feature." },
                    score: { type: Type.INTEGER, description: "Score for this feature from 0 to 100." }
                },
                required: ['feature', 'score']
            }
        },
        detailedScores: {
            type: Type.ARRAY,
            description: "An array of detailed ratio calculations. Should include ratios related to the feature scores. Provide an empty array if validation fails.",
            items: {
                type: Type.OBJECT,
                properties: {
                    ratioName: { type: Type.STRING, description: "Name of the specific ratio measured (e.g., 'Face Width / Height', 'Nose Length / Philtrum-Chin Length', 'Forehead Height / Face Width')." },
                    value: { type: Type.STRING, description: "The calculated ratio value as a string (e.g., '1.62')." },
                    deviation: { type: Type.INTEGER, description: "The percentage deviation from the golden ratio (1.618)." }
                },
                required: ['ratioName', 'value', 'deviation']
            }
        },
        overlayLines: {
            type: Type.ARRAY,
            description: "Array of lines for the front-view image. Coordinates are normalized (0.0-1.0). Provide an empty array if validation fails or it's a side-view.",
            items: {
                type: Type.OBJECT,
                properties: {
                    x1: { type: Type.NUMBER, description: "Normalized starting x-coordinate (0.0-1.0)." },
                    y1: { type: Type.NUMBER, description: "Normalized starting y-coordinate (0.0-1.0)." },
                    x2: { type: Type.NUMBER, description: "Normalized ending x-coordinate (0.0-1.0)." },
                    y2: { type: Type.NUMBER, description: "Normalized ending y-coordinate (0.0-1.0)." },
                    label: { type: Type.STRING, description: "Optional label for the line." }
                },
                required: ['x1', 'y1', 'x2', 'y2']
            }
        }
    },
    required: ['overallScore', 'feedback', 'featureScores', 'detailedScores', 'overlayLines']
};

export const analyzeFace = async (image: ImageFile | null): Promise<AnalysisResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    if (!image) {
        throw new Error("An image is required for analysis.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = await fileToGenerativePart(image);

    const prompt = `You are an expert in facial aesthetics and the golden ratio (phi, approx 1.618). Analyze the provided face image.

First, VALIDATE the image:
1.  If more than one face is detected, respond ONLY with a JSON object that sets 'error' to 'MULTIPLE_FACES' and 'errorMessage' to 'Please upload a clear photo with only one visible face.'. Populate other fields with default empty/zero values.
2.  If the image is blurry, low-quality, or a face cannot be clearly detected, respond ONLY with a JSON object that sets 'error' to 'LOW_QUALITY' and 'errorMessage' to 'Face not detected properly. Please upload a clear front or side image.'. Populate other fields with default empty/zero values.

If the image is VALID:
1.  Identify key facial landmarks.
2.  Calculate the ratios between these landmarks. Specifically measure for: 'Facial Symmetry', 'Eye Spacing', 'Nose to Lip Ratio', and 'Forehead Height to Face Width'.
3.  Compare each significant ratio to the golden ratio to determine harmony and balance.
4.  Generate a detailed analysis.
5.  For the 'featureScores' array, provide a score from 0-100 for each of these specific features: 'Facial Symmetry', 'Eye Spacing', 'Nose to Lip Ratio', and 'Forehead Height to Face Width'. You can include other relevant features as well.
6.  For the 'detailedScores' array, show each measured ratio (e.g., 'Face Width / Height', 'Nose Length / Philtrum-Chin Length', 'Forehead Height / Face Width'), its calculated value, and its percentage deviation from the golden ratio.
7.  For 'overlayLines', provide normalized coordinates (0.0 to 1.0) for significant golden ratio lines. If it's a side-view photo, return an empty array for overlayLines.
8.  Provide your response strictly in the specified JSON format. Do not include any text, markdown, or code block syntax outside of the JSON object.`;

    const contents = {
        parts: [{ text: prompt }, imagePart],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });

    try {
        const text = response.text.trim();
        const result = JSON.parse(text);
        return result as AnalysisResult;
    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text);
        throw new Error("Could not parse the analysis result from the AI. The response was not valid JSON.");
    }
};