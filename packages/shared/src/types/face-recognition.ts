/**
 * Face Recognition Types
 * Shared types for face recognition functionality
 */

export interface FaceEmbedding {
  embedding: Float32Array;
  confidence: number;
  timestamp: string;
}

export interface FaceDetectionResult {
  detected: boolean;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    mouth: { x: number; y: number };
  };
  faceCount?: number;
  quality?: FaceQualityResult;
  error?: string;
}

export interface FaceQualityResult {
  brightness: number;
  sharpness: number;
  contrast: number;
  faceSize: number;
  faceResolution: number;
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'unacceptable';
  issues: string[];
}

export interface FaceRecognitionResult {
  success: boolean;
  embedding?: Float32Array;
  detection?: FaceDetectionResult;
  quality?: FaceQualityResult;
  error?: string;
  warnings?: string[];
}

export interface GenerateEmbeddingRequest {
  imageData: string; // Base64 encoded image
  employeeId?: string;
}

export interface GenerateEmbeddingResponse {
  success: boolean;
  embedding?: number[];
  detection?: FaceDetectionResult;
  quality?: FaceQualityResult;
  error?: string;
  warnings?: string[];
}

export interface EmbeddingGenerationProgress {
  step: 'loading' | 'detecting' | 'analyzing' | 'generating' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  details?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  totalTime?: number;
  preprocessTime?: number;
  detectionTime?: number;
  embeddingTime?: number;
  inferenceTime?: number;
}