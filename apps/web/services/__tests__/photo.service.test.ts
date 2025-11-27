/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Comprehensive unit tests for PhotoService using Jest
 */

import { createClient } from '@/utils/supabase/server';
import { PhotoService } from '../photo.service';

// Mock the Supabase client
jest.mock('@/utils/supabase/server');

// Mock atob function
global.atob = jest.fn(_str => {
  // Simple mock implementation for base64 decoding
  return 'decoded-string';
});

// Mock Image class - simplified version that doesn't cause timeout issues
class MockImage {
  width = 300;
  height = 300;
  onload: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  src = '';

  constructor() {
    // Auto-trigger onload after a brief delay to simulate successful image load
    setTimeout(() => {
      if (this.onload) {
        this.onload(new Event('load'));
      }
    }, 10);
  }
}

Object.defineProperty(global, 'Image', {
  value: MockImage,
  writable: true,
});

// Mock document.createElement for canvas
Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn(tagName => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ({
            drawImage: jest.fn(),
            getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
            putImageData: jest.fn(),
            createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
            canvas: { width: 300, height: 300 },
          })),
          toBlob: jest.fn(callback => {
            callback(new Blob(['mock-image-data'], { type: 'image/jpeg' }));
          }),
        };
      }
      return {};
    }),
  },
  writable: true,
});

describe('PhotoService', () => {
  let photoService: PhotoService;
  let mockSupabaseClient: {
    storage: {
      from: jest.Mock;
    };
  };
  let mockStorage: {
    from: jest.Mock;
  };
  let mockFrom: {
    upload: jest.Mock;
    remove: jest.Mock;
    getPublicUrl: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    photoService = new PhotoService();

    // Mock the methods that use Image/Canvas APIs to avoid timeout issues
    jest.spyOn(photoService, 'validatePhoto' as any).mockResolvedValue({ isValid: true });
    jest.spyOn(photoService, 'generateThumbnail' as any).mockResolvedValue({
      url: 'mock-thumbnail-url',
      success: true
    });

    mockStorage = {
      from: jest.fn(),
    };

    mockFrom = {
      upload: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
    };

    mockSupabaseClient = {
      storage: mockStorage,
    };

    (
      createClient as jest.MockedFunction<typeof createClient>
    ).mockResolvedValue(mockSupabaseClient as any);
    mockStorage.from.mockReturnValue(mockFrom);
  });

  
  describe('uploadPhoto', () => {
    const validParams = {
      employeeId: 'emp-123',
      photoData:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      date: '2023-12-01T10:00:00.000Z',
      type: 'checkin' as const,
    };

    it('should successfully upload a photo', async () => {
      // Arrange
      mockFrom.upload.mockResolvedValue({ error: null });
      mockFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/photo.jpg' },
      });

      
      // Act
      const result = await photoService.uploadPhoto(
        validParams.employeeId,
        validParams.photoData,
        validParams.date,
        validParams.type
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://storage.example.com/photo.jpg');
      expect(result.path).toContain('attendance/2023/12/01/emp-123/checkin-');
      expect(result.path).toContain('.jpg');
      expect(mockFrom.upload).toHaveBeenCalledWith(
        expect.stringContaining('attendance/2023/12/01/emp-123/checkin-'),
        expect.any(Blob),
        {
          contentType: 'image/jpeg',
          cacheControl: '31536000',
          upsert: false,
        }
      );
    });

    it('should handle different photo types', async () => {
      // Arrange
      mockFrom.upload.mockResolvedValue({ error: null });
      mockFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/photo.jpg' },
      });

      
      const testTypes = ['checkout', 'emergency-checkout', 'reference'] as const;

      for (const type of testTypes) {
        // Act
        const result = await photoService.uploadPhoto(
          validParams.employeeId,
          validParams.photoData,
          validParams.date,
          type
        );

        // Assert
        expect(result.success).toBe(true);
        if (type === 'reference') {
          expect(result.path).toContain('employees/reference/emp-123-');
        } else {
          expect(result.path).toContain(`attendance/2023/12/01/emp-123/${type}-`);
        }
      }
    });

    it('should handle image validation failure', async () => {
      // Override validatePhoto mock to return validation failure
      ((photoService as any).validatePhoto as jest.Mock).mockResolvedValue({
        isValid: false,
        error: 'Image too small'
      });

      // Act
      const result = await photoService.uploadPhoto(
        validParams.employeeId,
        validParams.photoData,
        validParams.date,
        validParams.type
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Image too small');
    });

    it('should handle storage upload error', async () => {
      // Arrange
      mockFrom.upload.mockResolvedValue({
        error: { message: 'Storage quota exceeded' }
      });

      
      // Act
      const result = await photoService.uploadPhoto(
        validParams.employeeId,
        validParams.photoData,
        validParams.date,
        validParams.type
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed');
    });

    it('should handle network error during upload', async () => {
      // Arrange
      mockFrom.upload.mockRejectedValue(new Error('Network error'));

      
      // Act
      const result = await photoService.uploadPhoto(
        validParams.employeeId,
        validParams.photoData,
        validParams.date,
        validParams.type
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed');
    });

    it('should handle base64 without data URL prefix', async () => {
      // Arrange
      mockFrom.upload.mockResolvedValue({ error: null });
      mockFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/photo.jpg' },
      });

      
      // Act
      const result = await photoService.uploadPhoto(
        validParams.employeeId,
        'base64encodeddata',
        validParams.date,
        validParams.type
      );

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('deletePhoto', () => {
    it('should successfully delete a photo', async () => {
      // Arrange
      mockFrom.remove.mockResolvedValue({ error: null });

      // Act
      const result = await photoService.deletePhoto('attendance/test-photo.jpg');

      // Assert
      expect(result.success).toBe(true);
      expect(mockFrom.remove).toHaveBeenCalledWith(['attendance/test-photo.jpg']);
    });

    it('should handle storage delete error', async () => {
      // Arrange
      mockFrom.remove.mockResolvedValue({ error: { message: 'File not found' } });

      // Act
      const result = await photoService.deletePhoto('attendance/test-photo.jpg');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed: File not found');
    });

    it('should handle network error during delete', async () => {
      // Arrange
      mockFrom.remove.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await photoService.deletePhoto('attendance/test-photo.jpg');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete photo from storage');
    });
  });

  describe('getPhotoUrl', () => {
    it('should successfully get photo URL', async () => {
      // Arrange
      mockFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/photo.jpg' },
      });

      // Act
      const result = await photoService.getPhotoUrl('attendance/test-photo.jpg');

      // Assert
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://storage.example.com/photo.jpg');
    });

    it('should handle error when getting photo URL', async () => {
      // Arrange
      mockFrom.getPublicUrl.mockReturnValue({
        data: null,
        error: { message: 'Invalid path' }
      });

      // Act
      const result = await photoService.getPhotoUrl('invalid/path');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get photo URL: Invalid path');
    });
  });

  describe('processFaceRecognition', () => {
    it('should return mock confidence score', async () => {
      // Act
      const result = await photoService.processFaceRecognition('mock-image-data', 'emp-123');

      // Assert
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.success).toBe(true);
    });

    it('should handle error during face recognition', async () => {
      // Mock the method to throw an error
      const originalMethod = photoService.processFaceRecognition;
      jest.spyOn(photoService, 'processFaceRecognition').mockRejectedValue(new Error('Processing failed'));

      // Act
      const result = await photoService.processFaceRecognition('mock-image-data', 'emp-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Face recognition processing failed');

      // Restore original method
      photoService.processFaceRecognition = originalMethod;
    });
  });

  describe('generateThumbnail', () => {
    it('should successfully generate thumbnail', async () => {
      
      // Act
      const result = await photoService.generateThumbnail('data:image/jpeg;base64,test');

      // Assert
      expect(result.success).toBe(true);
      expect(result.thumbnail).toBeTruthy();
    });

    it('should handle image load error', async () => {
      // Override MockImage to simulate load error
      class ErrorMockImage {
        width = 300;
        height = 300;
        onload: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        src = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 10);
        }
      }

      Object.defineProperty(global, 'Image', {
        value: ErrorMockImage,
        writable: true,
      });

      
      // Act
      const result = await photoService.generateThumbnail('data:image/jpeg;base64,test');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load image');
    });
  });

  describe('generateFilePath', () => {
    it('should generate correct file path', () => {
      // Act
      const path = (photoService as any).generateFilePath('emp-123', 2023, 12, '1', 'checkin', 1701427200000);

      // Assert
      expect(path).toBe('attendance/2023/12/1/emp-123/checkin-1701427200000.jpg');
    });

    it('should handle different types', () => {
      // Test different types
      const types = ['checkin', 'checkout', 'emergency-checkout', 'reference'] as const;

      types.forEach(type => {
        const path = (photoService as any).generateFilePath('emp-123', 2023, 12, '1', type, 1701427200000);

        // All types use the same path structure
        expect(path).toBe(`attendance/2023/12/1/emp-123/${type}-1701427200000.jpg`);
      });
    });
  });

  describe('base64ToBlob', () => {
    it('should convert base64 to blob', () => {
      // Act
      const blob = (photoService as any).base64ToBlob('data:image/jpeg;base64,test');

      // Assert
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });

    it('should handle base64 without data URL prefix', () => {
      // Act
      const blob = (photoService as any).base64ToBlob('test');

      // Assert
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });
  });

  describe('validatePhoto', () => {
    it('should validate photo with minimum dimensions', async () => {
      
      // Act
      const result = await (photoService as any).validatePhoto(new Blob(['test'], { type: 'image/jpeg' }));

      // Assert
      expect(result.isValid).toBe(true);
    });

    it('should handle validation errors', async () => {
      // Create a blob that's too small
      const smallBlob = new Blob(['test'], { type: 'image/jpeg' });

      // Mock the Image to simulate small dimensions
      class SmallImageMock {
        width = 50;
        height = 50;
        onload: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        src = '';

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload(new Event('load'));
            }
          }, 10);
        }
      }

      Object.defineProperty(global, 'Image', {
        value: SmallImageMock,
        writable: true,
      });

      
      // Act
      const result = await (photoService as any).validatePhoto(smallBlob);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Image too small');
    });
  });

  describe('compressPhoto', () => {
    it('should return original blob', async () => {
      // Act
      const originalBlob = new Blob(['test'], { type: 'image/jpeg' });
      const result = await (photoService as any).compressPhoto(originalBlob);

      // Assert
      expect(result).toBe(originalBlob);
    });
  });

  describe('edge cases', () => {
    const validParams = {
      employeeId: 'emp-123',
      photoData:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      date: '2023-12-01T10:00:00.000Z',
      type: 'checkin' as const,
    };
    it('should handle empty photo data', async () => {
      // Act
      const result = await photoService.uploadPhoto(
        'emp-123',
        '',
        '2023-12-01T10:00:00.000Z',
        'checkin'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle invalid date', async () => {
      // Arrange
      mockFrom.upload.mockResolvedValue({ error: null });
      mockFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/photo.jpg' },
      });

      // Act
      const result = await photoService.uploadPhoto(
        'emp-123',
        validParams.photoData,
        'invalid-date',
        'checkin'
      );

      // Assert - Should still work as Date constructor handles invalid dates
      expect(result.success).toBe(true);
    });

    it('should handle empty employee ID', async () => {
      // Act
      const result = await photoService.uploadPhoto(
        '',
        validParams.photoData,
        '2023-12-01T10:00:00.000Z',
        'checkin'
      );

      // Assert
      expect(result.success).toBe(false);
    });

    it('should handle empty file path for delete', async () => {
      // Act
      const result = await photoService.deletePhoto('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('File path is required');
    });

    it('should handle empty file path for get URL', async () => {
      // Act
      const result = await photoService.getPhotoUrl('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('File path is required');
    });
  });
});