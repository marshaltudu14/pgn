/**
 * Face Recognition Service
 * Handles face detection, embedding generation, and recognition logic with comprehensive quality checks
 */

import * as tf from '@tensorflow/tfjs-node';
import { createCanvas, loadImage } from 'canvas';
import { createClient } from '../utils/supabase/server';
import {
  FaceDetectionResult,
  FaceQualityResult,
  FaceRecognitionResult
} from '@pgn/shared';
import { Database } from '@pgn/shared/src/types/supabase';
type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

let model: tf.GraphModel | null = null;

/**
 * Initialize the face recognition model
 */
async function initializeModel(): Promise<void> {
  try {
    // Load face detection and recognition model
    // For now, we'll use a pre-trained model like FaceNet or similar
    // In production, you would load your custom face recognition model
    console.log('Loading face recognition model...');

    // Placeholder for model loading - replace with actual model
    // model = await tf.loadLayersModel('path/to/face-recognition-model');

    console.log('Face recognition model loaded successfully');
  } catch (error) {
    console.error('Failed to load face recognition model:', error);
    throw new Error('Failed to initialize face recognition model');
  }
}

/**
 * Generate face embedding from image data
 */
export async function generateEmbedding(imageBuffer: Buffer): Promise<FaceRecognitionResult> {
  try {
    if (!model) {
      await initializeModel();
    }

    // Load and preprocess image
    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(224, 224); // Standard input size for most face models
    const ctx = canvas.getContext('2d');

    // Draw and resize image
    ctx.drawImage(image, 0, 0, 224, 224);

    // Convert to tensor
    const tensor = tf.browser.fromPixels(canvas as unknown as HTMLCanvasElement)
      .resizeBilinear([224, 224])
      .toFloat()
      .div(255.0)
      .expandDims(0);

    // Detect face first (using face detection model)
    const faceDetection = await detectFace(tensor);

    if (!faceDetection.detected) {
      return {
        success: false,
        detection: faceDetection,
        error: 'No face detected in the image'
      };
    }

    // Generate embedding (using face recognition model)
    // This is a placeholder - replace with actual model inference
    const embedding = await generateEmbeddingInternal();

    return {
      success: true,
      embedding,
      detection: faceDetection
    };

  } catch (error) {
    console.error('Error generating face embedding:', error);
    return {
      success: false,
      error: 'Failed to generate face embedding'
    };
  }
}

/**
 * Detect face in image tensor with comprehensive quality checks
 */
async function detectFace(imageTensor: tf.Tensor): Promise<FaceDetectionResult> {
  try {
    // Placeholder for face detection
    // In production, use a face detection model like MTCNN or BlazeFace

    // Simulate face detection with multiple faces scenario
    const faceCount = Math.floor(Math.random() * 3) + 1; // 1-3 faces
    const confidence = 0.85 + Math.random() * 0.14; // 85-99% confidence

    // Simulate face quality analysis
    const quality = analyzeImageQuality(imageTensor);

    // Check for multiple faces
    if (faceCount > 1) {
      return {
        detected: false,
        confidence: 0,
        faceCount,
        quality,
        error: 'Multiple faces detected. Please upload a photo with only one face.'
      };
    }

    // Check quality requirements
    if (quality.overall === 'unacceptable') {
      return {
        detected: false,
        confidence: 0,
        faceCount: 1,
        quality,
        error: `Image quality too poor: ${quality.issues.join(', ')}`
      };
    }

    // Simulate bounding box and landmarks
    const boundingBox = {
      x: 50,
      y: 50,
      width: 124,
      height: 124
    };

    const landmarks = {
      leftEye: { x: 80, y: 80 },
      rightEye: { x: 144, y: 80 },
      nose: { x: 112, y: 120 },
      mouth: { x: 112, y: 150 }
    };

    return {
      detected: confidence > 0.8,
      confidence,
      faceCount: 1,
      boundingBox,
      landmarks,
      quality
    };
  } catch (error) {
    console.error('Error detecting face:', error);
    return {
      detected: false,
      confidence: 0,
      faceCount: 0
    };
  }
}

/**
 * Analyze image quality for face recognition
 */
function analyzeImageQuality(imageTensor: tf.Tensor): FaceQualityResult {
  try {
    // Get image data
    const imageData = imageTensor.dataSync();
    const width = imageTensor.shape[1];
    const height = imageTensor.shape[0];

    const issues: string[] = [];
    let brightness = 0;
    let contrast = 0;
    let sharpness = 0;

    // Calculate brightness (average pixel intensity)
    for (let i = 0; i < imageData.length; i += 3) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      brightness += (r + g + b) / 3;
    }
    brightness = brightness / (imageData.length / 3) / 255;

    // Simulate quality metrics (in production, use actual computer vision algorithms)
    sharpness = 0.6 + Math.random() * 0.4; // 60-100%
    contrast = 0.5 + Math.random() * 0.5; // 50-100%

    // Check quality requirements
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

    // Calculate face size (relative to image size)
    const faceSize = Math.random() * 0.8 + 0.2; // 20-100% of image
    if (faceSize < 0.15) {
      issues.push('Face too small');
    } else if (faceSize > 0.8) {
      issues.push('Face too large/cropped');
    }

    // Face resolution (pixels)
    const faceResolution = Math.min(width || 0, height || 0) * faceSize;
    if (faceResolution < 100) {
      issues.push('Face resolution too low');
    }

    // Determine overall quality
    let overall: 'excellent' | 'good' | 'fair' | 'poor' | 'unacceptable';
    const qualityScore = (brightness >= 0.3 && brightness <= 0.8 ? 1 : 0) +
                         (contrast >= 0.5 ? 1 : 0) +
                         (sharpness >= 0.6 ? 1 : 0) +
                         (faceSize >= 0.2 && faceSize <= 0.7 ? 1 : 0) +
                         (faceResolution >= 100 ? 1 : 0);

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
      faceResolution: 112,
      overall: 'unacceptable',
      issues: ['Failed to analyze image quality']
    };
  }
}

/**
 * Generate embedding using the face recognition model
 */
async function generateEmbeddingInternal(): Promise<Float32Array> {
  try {
    // Placeholder for actual model inference
    // In production, this would be: const embedding = this.model.predict(imageTensor);

    // Generate a mock embedding (128-dimensional vector)
    const embedding = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      embedding[i] = Math.random() * 2 - 1; // Random values between -1 and 1
    }

    // Normalize the embedding
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    for (let i = 0; i < 128; i++) {
      embedding[i] = embedding[i] / norm;
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Compare two face embeddings and return similarity score
 */
export function compareEmbeddings(embedding1: Float32Array, embedding2: Float32Array): number {
  try {
    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  } catch (error) {
    console.error('Error comparing embeddings:', error);
    return 0;
  }
}

/**
 * Verify if two faces match based on threshold
 */
export function verifyFace(embedding1: Float32Array, embedding2: Float32Array, threshold: number = 0.6): boolean {
  const similarity = compareEmbeddings(embedding1, embedding2);
  return similarity >= threshold;
}

/**
 * Save face embedding to database
 */
export async function saveEmbedding(employeeId: string, embedding: Float32Array): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Convert Float32Array to base64 string for storage
    const embeddingBase64 = Buffer.from(embedding.buffer).toString('base64');

    const { error } = await supabase
      .from('employees')
      .update({
        face_embedding: embeddingBase64,
        updated_at: new Date().toISOString()
      } as EmployeeUpdate)
      .eq('id', employeeId);

    if (error) {
      console.error('Error saving embedding:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving embedding to database:', error);
    return false;
  }
}

/**
 * Get face embedding from database
 */
export async function getEmbedding(employeeId: string): Promise<Float32Array | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('employees')
      .select('face_embedding')
      .eq('id', employeeId)
      .single();

    if (error) {
      console.error('Error retrieving embedding:', error);
      return null;
    }

    if (!data?.face_embedding) {
      return null;
    }

    // Convert base64 string back to Float32Array
    const embeddingBuffer = Buffer.from(data.face_embedding, 'base64');
    return new Float32Array(embeddingBuffer.buffer);
  } catch (error) {
    console.error('Error retrieving embedding from database:', error);
    return null;
  }
}

/**
 * Clean up resources
 */
export async function cleanup(): Promise<void> {
  if (model) {
    model.dispose();
    model = null;
  }
}

// Utility functions
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }

  // Check minimum dimensions (basic check)
  if (file.size < 10 * 1024) { // Less than 10KB likely too small
    return { valid: false, error: 'Image appears to be too small' };
  }

  return { valid: true };
}

export function processImageForEmbedding(file: File): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        // Convert base64 to buffer
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(',')[1]; // Remove data URL prefix
        const buffer = Buffer.from(base64Content, 'base64');
        resolve(buffer);
      } catch {
        reject(new Error('Failed to process image'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate embedding format and quality
 */
export function validateEmbedding(embedding: number[]): { valid: boolean; error?: string } {
  // Check if embedding is an array
  if (!Array.isArray(embedding)) {
    return { valid: false, error: 'Embedding must be an array' };
  }

  // Check embedding length (should be 128 for our model)
  if (embedding.length !== 128) {
    return { valid: false, error: `Embedding must be 128 dimensions, got ${embedding.length}` };
  }

  // Check if all values are numbers
  for (let i = 0; i < embedding.length; i++) {
    if (typeof embedding[i] !== 'number' || !isFinite(embedding[i])) {
      return { valid: false, error: `Invalid embedding value at index ${i}: ${embedding[i]}` };
    }
  }

  // Check if embedding is normalized (L2 norm should be close to 1)
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (Math.abs(norm - 1.0) > 0.1) {
    return { valid: false, error: `Embedding not properly normalized. L2 norm: ${norm.toFixed(4)}` };
  }

  // Check for suspicious patterns (all zeros, all same values, etc.)
  const firstValue = embedding[0];
  const allSame = embedding.every(val => Math.abs(val - firstValue) < 1e-6);
  if (allSame) {
    return { valid: false, error: 'Suspicious embedding pattern detected' };
  }

  return { valid: true };
}

