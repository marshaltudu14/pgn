import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { permissionService } from '@/services/permissions';

export interface CameraOptions {
  quality?: number;
  aspectRatio?: number;
  flash?: 'auto' | 'on' | 'off';
  type?: 'front' | 'back';
  // Additional options for compression
  maxWidth?: number;
  maxHeight?: number;
  format?: any; // ImageManipulator.SaveFormat
  targetSizeKB?: number;
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
    // Check permissions (don't request - just check, since AuthGuard already ensures permissions)
    const hasPermission = await permissionService.checkCameraPermission();
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

// Take photo from camera using expo-image-picker (like dukancard)
export async function takePhoto(
  options: CameraOptions = {}
): Promise<PhotoCaptureResult> {
  try {

    // Check camera permissions first (don't request - AuthGuard already ensures permissions)
    const existingPermission = await permissionService.checkCameraPermission();
    if (existingPermission !== 'granted') {
      throw new CameraError('CAMERA_PERMISSION_DENIED', 'Camera permission is required');
    }

    // Use expo-image-picker with correct API
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], // Use array of MediaType strings
      allowsEditing: false, // We'll handle cropping ourselves
      quality: 1, // Maximum quality, we'll compress later
      aspect: options.aspectRatio ? [options.aspectRatio, options.aspectRatio] : undefined,
    });

    if (result.canceled) {
      // User canceled the photo capture
      throw new CameraError('PHOTO_CAPTURE_CANCELED', 'User canceled photo capture');
    }

    if (!result.assets || result.assets.length === 0) {
      throw new CameraError('PHOTO_CAPTURE_FAILED', 'No photo captured');
    }

    const asset = result.assets[0];
    if (!asset) {
      throw new CameraError('PHOTO_CAPTURE_FAILED', 'Invalid photo asset');
    }

    // Process the captured photo and aggressively compress it
    const processedPhoto = await processCapturedPhoto({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    }, options);

  
    return processedPhoto;

  } catch (error) {
    // If it's already a CameraError (like PHOTO_CAPTURE_CANCELED), re-throw it as-is
    if (error instanceof CameraError) {
      throw error;
    }
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
      mediaTypes: ['images'], // Use array of MediaType strings
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

// Ultra aggressive image compression based on dukancard implementation
// Modified for selfies (1:1 aspect ratio instead of 4:5)
async function compressImageUltraAggressive(
  imageUri: string,
  options: CameraOptions = {}
): Promise<PhotoCaptureResult> {
  const {
    maxWidth = 600,  // Smaller for selfies
    maxHeight = 600,  // Square for selfies
    quality = 0.8,
    format = ImageManipulator.SaveFormat.JPEG,
    targetSizeKB = 80, // Target less than 100KB for attendance
  } = options;

  try {

    // First get original dimensions to calculate proper 1:1 crop for selfies
    const originalResult = await ImageManipulator.manipulateAsync(imageUri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const originalWidth = originalResult.width;
    const originalHeight = originalResult.height;
    const targetAspect = 1; // 1:1 aspect ratio for selfies

    // Calculate crop dimensions for 1:1 aspect ratio (square for selfies)
    let cropWidth, cropHeight;
    if (originalWidth / originalHeight > targetAspect) {
      // Image is wider than square - crop the width
      cropHeight = originalHeight;
      cropWidth = originalHeight * targetAspect;
    } else {
      // Image is taller than square - crop the height
      cropWidth = originalWidth;
      cropHeight = originalWidth / targetAspect;
    }

    // Calculate crop position (center the crop)
    const cropX = (originalWidth - cropWidth) / 2;
    const cropY = (originalHeight - cropHeight) / 2;

    // First pass: Crop to 1:1, then resize to max dimensions
    let resultWidth = Math.min(maxWidth, cropWidth);
    let resultHeight = Math.min(maxHeight, cropHeight);

    // Ensure minimum 400px resolution for face recognition
    if (resultWidth < 400) {
      resultWidth = 400;
      resultHeight = 400; // Maintain 1:1 aspect ratio
    }
    if (resultHeight < 400) {
      resultHeight = 400;
      resultWidth = 400; // Maintain 1:1 aspect ratio
    }

    let result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: cropX,
            originY: cropY,
            width: cropWidth,
            height: cropHeight,
          },
        },
        {
          resize: {
            width: resultWidth,
            height: resultHeight,
          },
        },
      ],
      {
        compress: quality,
        format,
        base64: true,
      }
    );

    // Calculate current size using base64 length (more accurate than file size)
    let currentSizeKB = result.base64
      ? (result.base64.length * 0.75) / 1024
      : 0;

    
    // Keep compressing until target size is achieved with proper limits
    // Strategy: Reduce resolution first (maintain 400px minimum), then reduce quality (not below 65%)
    let currentQuality = quality;
    let resolutionRound = 0;
    const maxResolutionRounds = 3; // Fewer rounds for smaller selfie target
    const maxTotalRounds = 15; // Prevent infinite loops
    let totalRounds = 0;

    while (currentSizeKB > targetSizeKB && totalRounds < maxTotalRounds) {
      totalRounds++;

      // First try resolution reduction (maintain 400px minimum for selfies)
      if (resolutionRound < maxResolutionRounds) {
        resolutionRound++;
        const scaleFactor = Math.sqrt(targetSizeKB / currentSizeKB) * 0.9; // 10% extra reduction for safety
        let newWidth = Math.floor(result.width * scaleFactor);
        let newHeight = Math.floor(result.height * scaleFactor);

        // Only enforce minimum 400px if we're not already below it and the scale factor makes sense
        if (newWidth < 400 && scaleFactor > 0.8) {
          // Skip to quality reduction if we can't reduce resolution further
          resolutionRound = maxResolutionRounds;
          continue;
        }

        // Apply minimum constraints only if they're larger than calculated values
        newWidth = Math.max(newWidth, 400);
        newHeight = Math.max(newHeight, 400);

        result = await ImageManipulator.manipulateAsync(
          result.uri,
          [
            {
              resize: {
                width: newWidth,
                height: newHeight,
              },
            },
          ],
          {
            compress: currentQuality, // Keep original quality during resolution reduction
            format,
            base64: true,
          }
        );

        currentSizeKB = result.base64 ? (result.base64.length * 0.75) / 1024 : 0;
        
        // If still too large after max resolution rounds, continue to quality reduction
        if (currentSizeKB <= targetSizeKB || resolutionRound >= maxResolutionRounds) {
          continue;
        }
      }

      // Quality reduction phase - don't go below 65% quality for face recognition
      if (currentQuality > 0.65) {
        currentQuality = Math.max(0.65, currentQuality - 0.05); // Gentle quality reduction, minimum 65%

        result = await ImageManipulator.manipulateAsync(result.uri, [], {
          compress: currentQuality,
          format,
          base64: true,
        });

        currentSizeKB = result.base64 ? (result.base64.length * 0.75) / 1024 : 0;
                continue;
      }

      // If we've hit 65% quality minimum and still too large, make final quality adjustment
      if (currentQuality <= 0.65 && currentQuality > 0.6) {
        currentQuality = 0.6; // Final minimum quality for selfies

        result = await ImageManipulator.manipulateAsync(result.uri, [], {
          compress: currentQuality,
          format,
          base64: true,
        });

        currentSizeKB = result.base64 ? (result.base64.length * 0.75) / 1024 : 0;
                continue;
      }

      // If still too large after hitting quality minimum, do one final resolution reduction
      const scaleFactor = Math.sqrt(targetSizeKB / currentSizeKB) * 0.95;
      let finalWidth = Math.floor(result.width * scaleFactor);
      let finalHeight = Math.floor(result.height * scaleFactor);

      // For final attempt, allow going below 400px if necessary
      result = await ImageManipulator.manipulateAsync(
        result.uri,
        [
          {
            resize: {
              width: finalWidth,
              height: finalHeight,
            },
          },
        ],
        {
          compress: 0.6, // Reset to 60% quality for final attempt
          format,
          base64: true,
        }
      );

      currentSizeKB = result.base64 ? (result.base64.length * 0.75) / 1024 : 0;
      currentQuality = 0.6;
          }

    // Final validation
    if (!result.base64 || result.base64.length === 0) {
      throw new Error("Compression failed: no base64 data produced");
    }

    
    return {
      uri: result.uri,
      base64: result.base64,
      width: result.width,
      height: result.height,
      fileSize: result.base64.length * 0.75, // Convert base64 length to approximate bytes
      type: 'image/jpeg',
      name: `selfie_${Date.now()}.jpg`
    };

  } catch (error) {
    console.error('🗜️ compressImageUltraAggressive: Failed to compress image:', error);
    throw new CameraError('PHOTO_COMPRESSION_ERROR', 'Failed to compress image', error);
  }
}

// Process captured photo using ultra aggressive compression (dukancard style)
async function processCapturedPhoto(
  photo: {
    uri: string;
    width?: number;
    height?: number;
  },
  options: CameraOptions
): Promise<PhotoCaptureResult> {
  try {

    // Use dukancard's ultra aggressive compression adapted for selfies
    return await compressImageUltraAggressive(photo.uri, options);

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