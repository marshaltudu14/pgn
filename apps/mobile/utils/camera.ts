import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { permissionService } from '@/services/permissions';

export interface CameraOptions {
  quality?: number;
  aspectRatio?: number;
  flash?: 'auto' | 'on' | 'off';
  type?: 'front' | 'back';
}

export interface PhotoCaptureResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  fileSize?: number;
  type?: string;
  name?: string;
}

export class CameraError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'CameraError';
  }
}

/**
 * Camera utility functions for photo capture and processing
 */

// Request camera permissions
export async function requestCameraPermissions(): Promise<boolean> {
  try {
    const hasPermission = await permissionService.requestCameraPermission();
    return hasPermission === 'granted';
  } catch (error) {
    console.error('Failed to request camera permission:', error);
    return false;
  }
}

// Check if camera is available and has permissions
export async function isCameraAvailable(): Promise<boolean> {
  try {
    // Check permissions directly - CameraView.isAvailableAsync() is deprecated on Android
    const hasPermission = await permissionService.requestCameraPermission();
    return hasPermission === 'granted';
  } catch (error) {
    console.error('Error checking camera availability:', error);
    return false;
  }
}

// Get camera type
export function getCameraType(frontFacing: boolean = true): 'front' | 'back' {
  return frontFacing ? 'front' : 'back';
}

// Toggle camera between front and back
export function toggleCameraType(currentType: 'front' | 'back'): 'front' | 'back' {
  return currentType === 'front' ? 'back' : 'front';
}

// Take photo from camera
export async function takePhoto(
  cameraRef: CameraView | null,
  options: CameraOptions = {}
): Promise<PhotoCaptureResult> {
  try {
    console.log('📸 takePhoto: Starting photo capture');
    console.log('📸 takePhoto: Camera ref type:', typeof cameraRef);
    console.log('📸 takePhoto: Camera ref exists:', !!cameraRef);
    console.log('📸 takePhoto: Options:', options);

    if (!cameraRef) {
      console.log('📸 takePhoto: ERROR - Camera ref is null or undefined');
      throw new CameraError('CAMERA_NOT_READY', 'Camera is not ready');
    }

    console.log('📸 takePhoto: Camera ref details:', {
      hasTakePicture: typeof (cameraRef as any).takePictureAsync,
      refObject: cameraRef
    });

    console.log('📸 takePhoto: About to call takePictureAsync...');
    const takePictureOptions = {
      quality: options.quality || 0.8,
      base64: true,
      exif: false
    };
    console.log('📸 takePhoto: takePictureAsync options:', takePictureOptions);

    const photo = await cameraRef.takePictureAsync(takePictureOptions);

    console.log('📸 takePhoto: takePictureAsync completed');
    console.log('📸 takePhoto: Photo result type:', typeof photo);
    console.log('📸 takePhoto: Photo result exists:', !!photo);

    if (photo) {
      console.log('📸 takePhoto: Photo result keys:', Object.keys(photo));
      console.log('📸 takePhoto: Photo details:', {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        hasBase64: !!photo.base64
      });
    }

    if (!photo) {
      console.log('📸 takePhoto: ERROR - Photo result is null or undefined');
      throw new CameraError('PHOTO_CAPTURE_FAILED', 'Failed to capture photo - result was null');
    }

    console.log('📸 takePhoto: Processing captured photo...');
    // Process the captured photo
    const processedPhoto = await processCapturedPhoto(photo, options);
    console.log('📸 takePhoto: Photo processed successfully');

    return processedPhoto;

  } catch (error) {
    console.log('📸 takePhoto: ERROR - Exception occurred');
    console.log('📸 takePhoto: Error type:', typeof error);
    console.log('📸 takePhoto: Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.log('📸 takePhoto: Error details:', error);
    console.error('Failed to take photo:', error);
    throw new CameraError('PHOTO_CAPTURE_ERROR', 'Failed to capture photo', error);
  }
}

// Pick photo from gallery
export async function pickPhotoFromLibrary(options: {
  allowsEditing?: boolean;
  quality?: number;
  aspectRatio?: number;
} = {}): Promise<PhotoCaptureResult> {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== ImagePicker.PermissionStatus.GRANTED) {
      throw new CameraError('GALLERY_PERMISSION_DENIED', 'Gallery permission is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing || false,
      quality: options.quality || 0.8,
      base64: true,
      aspect: options.aspectRatio ? [options.aspectRatio, options.aspectRatio] : undefined,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      throw new CameraError('PHOTO_PICKER_CANCELED', 'Photo selection was canceled');
    }

    const asset = result.assets[0];
    if (!asset) {
      throw new CameraError('INVALID_PHOTO_ASSET', 'Invalid photo asset');
    }

    return {
      uri: asset.uri,
      base64: asset.base64 || undefined,
      width: asset.width || 0,
      height: asset.height || 0,
      fileSize: asset.fileSize || 0,
      type: asset.mimeType || 'image/jpeg',
      name: asset.fileName || 'photo.jpg'
    };

  } catch (error) {
    console.error('Failed to pick photo from library:', error);
    throw new CameraError('PHOTO_PICKER_ERROR', 'Failed to pick photo from library', error);
  }
}

// Process captured photo (compress, resize, etc.)
async function processCapturedPhoto(
  photo: {
    uri: string;
    base64?: string;
    width?: number;
    height?: number;
  },
  options: CameraOptions
): Promise<PhotoCaptureResult> {
  try {
    // For now, use the photo as-is without manipulation
    // In a real app, you might want to add basic compression here

    // Get file size
    const fileInfo = await getImageSize(photo.uri);

    return {
      uri: photo.uri,
      base64: photo.base64 || '',
      width: photo.width || 0,
      height: photo.height || 0,
      fileSize: fileInfo.size,
      type: 'image/jpeg',
      name: `selfie_${Date.now()}.jpg`
    };

  } catch (error) {
    console.error('Failed to process captured photo:', error);
    throw new CameraError('PHOTO_PROCESSING_ERROR', 'Failed to process photo', error);
  }
}

// Get image file size (simplified version)
async function getImageSize(uri: string): Promise<{ size: number; width: number; height: number }> {
  try {
    // Try to get file size from filesystem
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      return {
        size: blob.size,
        width: 0, // Would need ImageManipulator or another library to get dimensions
        height: 0
      };
    } catch {
      // If we can't get file size, return estimated size
      return {
        size: estimateImageSize(300, 400), // Assume typical selfie dimensions
        width: 300,
        height: 400
      };
    }
  } catch (error) {
    console.error('Failed to get image size:', error);
    return { size: 0, width: 300, height: 400 };
  }
}

// Estimate image file size based on dimensions
function estimateImageSize(width: number, height: number): number {
  // Rough estimation: width * height * 0.3 (bytes per pixel for JPEG)
  return Math.round(width * height * 0.3);
}

// Validate photo quality
export function validatePhoto(photo: PhotoCaptureResult): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum dimensions
  if (photo.width < 200 || photo.height < 200) {
    errors.push('Photo is too small. Minimum size is 200x200 pixels.');
  }

  // Check maximum file size (100KB as requested)
  if (photo.fileSize && photo.fileSize > 100 * 1024) {
    errors.push('Photo is too large. Maximum size is 100KB after compression.');
  }

  // Check aspect ratio (should be portrait or square)
  if (photo.width > 0 && photo.height > 0) {
    const aspectRatio = photo.width / photo.height;
    if (aspectRatio > 1.5) {
      warnings.push('Photo aspect ratio is too wide. Consider using a portrait orientation.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Compress photo to target size (simplified version without ImageManipulator)
export async function compressPhoto(
  uri: string,
  targetSize: number = 100 * 1024, // 100KB target
  maxAttempts: number = 3
): Promise<PhotoCaptureResult> {
  try {
    // For now, just return the original photo
    // In a real implementation, you might use a different compression library
    const fileInfo = await getImageSize(uri);

    return {
      uri: uri,
      base64: '', // Would need to convert to base64 if needed
      width: 0,
      height: 0,
      fileSize: fileInfo.size,
      type: 'image/jpeg',
      name: `selfie_${Date.now()}.jpg`
    };

  } catch (error) {
    console.error('Failed to compress photo:', error);
    throw new CameraError('PHOTO_COMPRESSION_ERROR', 'Failed to compress photo', error);
  }
}