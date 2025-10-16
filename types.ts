export interface ImageFile {
  file: File;
}

export interface FeatureScore {
  feature: string;
  score: number;
}

export interface DetailedScore {
  ratioName: string;
  value: string;
  deviation: number;
}

export interface OverlayLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}

export interface AnalysisResult {
  overallScore: number;
  feedback: string;
  featureScores: FeatureScore[];
  detailedScores: DetailedScore[];
  overlayLines: OverlayLine[];
  error?: 'MULTIPLE_FACES' | 'LOW_QUALITY' | 'NO_FACE';
  errorMessage?: string;
}

export enum AppState {
    Idle,
    Loading,
    Result,
    Error,
}