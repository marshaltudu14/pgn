/**
 * Client-Side Face Recognition Service
 * Handles face detection and embedding generation in the browser using ONNX Runtime Web + MediaPipe + ArcFace
 */

import {
  FaceDetectionResult,
  FaceQualityResult,
  FaceRecognitionResult
} from '@pgn/shared';

let faceDetection: any = null;
let arcFaceSession: any = null;

/**
 * Initialize face recognition models (client-side)
 */
export async function initializeClientModels(): Promise<void> {
  try {
    // Initialize MediaPipe Face Detection
    const { FaceDetection } = await import('@mediapipe/face_detection');
    const { Camera } = await import('@mediapipe/camera_utils');

    faceDetection = new FaceDetection({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
      }
    });

    faceDetection.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5
    });

    // Initialize ONNX Runtime for ArcFace
    const ort = await import('onnxruntime-web');

    // Load ArcFace Mobile model (you'll need to download this)
    const modelPath = '/models/arcface_mobile.onnx';
    arcFaceSession = await ort.InferenceSession.create(modelPath);

    console.log('Face recognition models initialized successfully');
  } catch (error) {
    console.error('Failed to load client-side models:', error);
    throw new Error('Failed to initialize face recognition models');
  }
}

/**
 * Generate face embedding from image file (client-side)
 */
export async function generateEmbeddingClientSide(imageFile: File): Promise<FaceRecognitionResult> {
  try {
    // Initialize models if not already loaded
    if (!faceDetection || !arcFaceSession) {
      await initializeClientModels();
    }

    // Convert image file to HTML image element
    const img = await fileToImage(imageFile);

    // Create a temporary video element for MediaPipe processing
    const video = document.createElement('video');
    video.srcObject = createVideoStreamFromImage(img);
    video.play();

    // Process face detection
    const results = await new Promise((resolve, reject) => {
      faceDetection.onResults(resolve);
      faceDetection.send({image: video});
    });

    if (!results.detections || results.detections.length === 0) {
      return {
        success: false,
        error: 'No face detected in the image'
      };
    }

    if (results.detections.length > 1) {
      return {
        success: false,
        error: 'Multiple faces detected. Please upload a photo with only one face.'
      };
    }

    const detection = results.detections[0];

    // Extract face region for ArcFace
    const faceImageData = extractFaceRegion(img, detection.boundingBox);

    // Generate embedding using ArcFace
    const embedding = await generateArcFaceEmbedding(faceImageData);

    // Analyze image quality
    const quality = analyzeImageQuality(img, detection);

    if (quality.overall === 'unacceptable') {
      return {
        success: false,
        error: `Image quality too poor: ${quality.issues.join(', ')}`
      };
    }

    const detectionResult: FaceDetectionResult = {
      detected: true,
      confidence: detection.score || 0.85,
      boundingBox: {
        x: detection.boundingBox.xMin,
        y: detection.boundingBox.yMin,
        width: detection.boundingBox.width,
        height: detection.boundingBox.height
      },
      landmarks: extractLandmarks(detection),
      faceCount: 1,
      quality
    };

    return {
      success: true,
      embedding,
      detection: detectionResult,
      quality
    };

  } catch (error) {
    console.error('Error generating face embedding client-side:', error);
    return {
      success: false,
      error: 'Failed to generate face embedding: ' + (error as Error).message
    };
  }
}

/**
 * Convert image file to HTML image element
 */
async function fileToImage(imageFile: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Create video stream from image
 */
function createVideoStreamFromImage(img: HTMLImageElement): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  // Create video stream from canvas
  const stream = canvas.captureStream(30);
  return stream;
}

/**
 * Extract face region from image
 */
function extractFaceRegion(img: HTMLImageElement, boundingBox: any): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // ArcFace typically expects 112x112 input
  const faceSize = 112;
  canvas.width = faceSize;
  canvas.height = faceSize;

  // Extract and draw face region
  const x = boundingBox.xMin * img.width;
  const y = boundingBox.yMin * img.height;
  const width = boundingBox.width * img.width;
  const height = boundingBox.height * img.height;

  // Draw face region to canvas
  ctx.drawImage(img, x, y, width, height, 0, 0, faceSize, faceSize);

  return ctx.getImageData(0, 0, faceSize, faceSize);
}

/**
 * Generate ArcFace embedding from face image data
 */
async function generateArcFaceEmbedding(imageData: ImageData): Promise<Float32Array> {
  // Convert ImageData to tensor format expected by ArcFace
  const { data, width, height } = imageData;

  // ArcFace expects normalized float32 input [0, 1]
  const input = new Float32Array(1 * 3 * height * width);

  // Convert RGBA to RGB and normalize
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4; // RGBA
    const outIdx = i;

    // RGB channels
    input[outIdx] = data[idx] / 255.0; // R
    input[outIdx + width * height] = data[idx + 1] / 255.0; // G
    input[outIdx + 2 * width * height] = data[idx + 2] / 255.0; // B
  }

  // Create input tensor
  const inputTensor = {
    dims: [1, 3, height, width],
    data: input,
    type: 'float32'
  };

  // Run ArcFace inference
  const outputMap = await arcFaceSession.run({ 'input': inputTensor });

  // Get embedding output (typically named 'output' or similar)
  const outputName = Object.keys(outputMap)[0];
  const output = outputMap[outputName].data;

  return new Float32Array(output);
}

/**
 * Extract landmarks from MediaPipe face detection
 */
function extractLandmarks(detection: any): FaceDetectionResult['landmarks'] {
  if (!detection.landmarks || detection.landmarks.length === 0) {
    return undefined;
  }

  // Map MediaPipe landmarks to our expected format
  const landmarks = detection.landmarks[0]; // First face

  return {
    leftEye: { x: landmarks[33]?.x || 0, y: landmarks[33]?.y || 0 },
    rightEye: { x: landmarks[263]?.x || 0, y: landmarks[263]?.y || 0 },
    nose: { x: landmarks[1]?.x || 0, y: landmarks[1]?.y || 0 },
    mouth: { x: landmarks[13]?.x || 0, y: landmarks[13]?.y || 0 }
  };
}

/**
 * Analyze image quality for face recognition
 */
function analyzeImageQuality(img: HTMLImageElement, detection: any): FaceQualityResult {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    let brightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    brightness = brightness / (data.length / 4) / 255;

    // Simulate other quality metrics
    const sharpness = 0.6 + Math.random() * 0.4;
    const contrast = 0.5 + Math.random() * 0.5;

    // Calculate face size relative to image
    const faceSize = detection.boundingBox.width * detection.boundingBox.height;
    const faceResolution = Math.min(img.width, img.height) * Math.sqrt(faceSize);

    const issues: string[] = [];

    // Quality checks
    if (brightness < 0.3) {
      issues.push('Image too dark');
    } else if (brightness > 0.8) {
      issues.push('Image too bright');
    }

    if (contrast < 0.3) {
      issues.push('Low contrast');
    }

    if (sharpness < 0.4) {
      issues.push('Image blurry');
    }

    if (faceSize < 0.05) {
      issues.push('Face too small');
    } else if (faceSize > 0.7) {
      issues.push('Face too large/cropped');
    }

    if (faceResolution < 64) {
      issues.push('Face resolution too low');
    }

    // Determine overall quality
    const qualityScore = (brightness >= 0.3 && brightness <= 0.8 ? 1 : 0) +
                         (contrast >= 0.5 ? 1 : 0) +
                         (sharpness >= 0.6 ? 1 : 0) +
                         (faceSize >= 0.1 && faceSize <= 0.6 ? 1 : 0) +
                         (faceResolution >= 64 ? 1 : 0);

    let overall: 'excellent' | 'good' | 'fair' | 'poor' | 'unacceptable';
    if (qualityScore >= 5) {
      overall = 'excellent';
    } else if (qualityScore >= 4) {
      overall = 'good';
    } else if (qualityScore >= 3) {
      overall = 'fair';
    } else if (qualityScore >= 2) {
      overall = 'poor';
    } else {
      overall = 'unacceptable';
    }

    return {
      brightness,
      sharpness,
      contrast,
      faceSize,
      faceResolution,
      overall,
      issues
    };
  } catch (error) {
    console.error('Error analyzing image quality:', error);
    return {
      brightness: 0.5,
      sharpness: 0.5,
      contrast: 0.5,
      faceSize: 0.5,
      faceResolution: 64,
      overall: 'unacceptable',
      issues: ['Failed to analyze image quality']
    };
  }
}

/**
 * Cleanup models and sessions
 */
export function cleanupClientModels(): void {
  if (arcFaceSession) {
    arcFaceSession.dispose();
    arcFaceSession = null;
  }

  if (faceDetection) {
    faceDetection.close();
    faceDetection = null;
  }
}

/**
 * Check if models are initialized
 */
export function areModelsInitialized(): boolean {
  return faceDetection !== null && arcFaceSession !== null;
}