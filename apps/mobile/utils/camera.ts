import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
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
    console.log('📸 takePhoto: Camera ref exists:', !!cameraRef);

    if (!cameraRef) {
      console.log('📸 takePhoto: ERROR - Camera ref is null or undefined');
      throw new CameraError('CAMERA_NOT_READY', 'Camera is not ready');
    }

    // Check if cameraRef has the takePictureAsync method
    console.log('📸 takePhoto: Camera ref methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(cameraRef)));
    console.log('📸 takePhoto: Has takePictureAsync:', typeof (cameraRef as any).takePictureAsync);

    console.log('📸 takePhoto: About to call takePictureAsync with minimal options...');

    // Try the most basic call possible
    const photo = await (cameraRef as any).takePictureAsync();

    console.log('📸 takePhoto: Photo captured successfully:', photo);

    if (!photo) {
      console.log('📸 takePhoto: ERROR - Photo result is null or undefined');
      throw new CameraError('PHOTO_CAPTURE_FAILED', 'Failed to capture photo - result was null');
    }

    console.log('📸 takePhoto: Processing captured photo...');
    // Process the captured photo and convert to base64 for API
    const processedPhoto = await processCapturedPhoto(photo, options);
    console.log('📸 takePhoto: Photo processed successfully');

    return processedPhoto;

  } catch (error) {
    console.log('📸 takePhoto: ERROR - Exception occurred');
    console.log('📸 takePhoto: Error:', error);
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

// Process captured photo (compress, resize, convert to base64)
async function processCapturedPhoto(
  photo: {
    uri: string;
    width?: number;
    height?: number;
  },
  options: CameraOptions
): Promise<PhotoCaptureResult> {
  try {
    console.log('🖼️ processCapturedPhoto: Starting image processing');

    // Get image info first
    const imageInfo = await ImageManipulator.manipulateAsync(
      photo.uri,
      [],
      { format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('🖼️ processCapturedPhoto: Original image info:', {
      width: imageInfo.width,
      height: imageInfo.height,
      uri: imageInfo.uri
    });

    // Apply aspect ratio if specified
    const manipulations = [];
    if (options.aspectRatio) {
      const currentRatio = (imageInfo.width || 1) / (imageInfo.height || 1);
      const targetRatio = options.aspectRatio;

      if (Math.abs(currentRatio - targetRatio) > 0.1) {
        // Crop to target aspect ratio
        if (currentRatio > targetRatio) {
          // Image is wider - crop width
          const newWidth = Math.round((imageInfo.height || 1) * targetRatio);
          const cropX = Math.round(((imageInfo.width || 1) - newWidth) / 2);
          manipulations.push({
            crop: {
              originX: cropX,
              originY: 0,
              width: newWidth,
              height: imageInfo.height || 1,
            },
          });
        } else {
          // Image is taller - crop height
          const newHeight = Math.round((imageInfo.width || 1) / targetRatio);
          const cropY = Math.round(((imageInfo.height || 1) - newHeight) / 2);
          manipulations.push({
            crop: {
              originX: 0,
              originY: cropY,
              width: imageInfo.width || 1,
              height: newHeight,
            },
          });
        }
      }
    }

    // Resize to reasonable dimensions if needed
    const maxDimension = 1080; // Limit to 1080px for performance
    if ((imageInfo.width || 0) > maxDimension || (imageInfo.height || 0) > maxDimension) {
      const scale = Math.min(maxDimension / (imageInfo.width || 1), maxDimension / (imageInfo.height || 1));
      manipulations.push({
        resize: {
          width: Math.round((imageInfo.width || 1) * scale),
          height: Math.round((imageInfo.height || 1) * scale),
        },
      });
    }

    console.log('🖼️ processCapturedPhoto: Applying manipulations:', manipulations.length);

    // Apply manipulations and convert to base64
    const processedImage = await ImageManipulator.manipulateAsync(
      photo.uri,
      manipulations,
      {
        compress: options.quality || 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true, // Convert to base64 for API
      }
    );

    console.log('🖼️ processCapturedPhoto: Image processed successfully:', {
      uri: processedImage.uri,
      width: processedImage.width,
      height: processedImage.height,
      hasBase64: !!processedImage.base64
    });

    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(processedImage.uri);

    return {
      uri: processedImage.uri,
      base64: processedImage.base64 || '',
      width: processedImage.width || 0,
      height: processedImage.height || 0,
      fileSize: (fileInfo as any).size || 0,
      type: 'image/jpeg',
      name: `selfie_${Date.now()}.jpg`
    };

  } catch (error) {
    console.error('🖼️ processCapturedPhoto: Failed to process captured photo:', error);
    throw new CameraError('PHOTO_PROCESSING_ERROR', 'Failed to process photo', error);
  }
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
    // Get file info using FileSystem
    const fileInfo = await FileSystem.getInfoAsync(uri);

    return {
      uri: uri,
      base64: '', // Would need to convert to base64 if needed
      width: 0,
      height: 0,
      fileSize: (fileInfo as any).size || 0,
      type: 'image/jpeg',
      name: `selfie_${Date.now()}.jpg`
    };

  } catch (error) {
    console.error('Failed to compress photo:', error);
    throw new CameraError('PHOTO_COMPRESSION_ERROR', 'Failed to compress photo', error);
  }
}