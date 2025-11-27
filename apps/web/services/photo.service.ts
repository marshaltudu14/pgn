import { createClient } from '@/utils/supabase/server';

export class PhotoService {
  /**
   * Upload photo to Supabase storage with organized folder structure
   */
  async uploadPhoto(
    employeeId: string,
    photoData: string, // Base64 encoded image
    date: string,
    type: 'checkin' | 'checkout' | 'emergency-checkout' | 'reference'
  ): Promise<{ url: string; path: string; success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!employeeId || employeeId.trim() === '') {
        return {
          url: '',
          path: '',
          success: false,
          error: 'Employee ID is required'
        };
      }

      if (!photoData || photoData.trim() === '') {
        return {
          url: '',
          path: '',
          success: false,
          error: 'Photo data is required'
        };
      }

      const supabase = await createClient();

      // Parse date components for folder structure
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const timestamp = Date.now();

      // Create organized file path
      const filePath = this.generateFilePath(employeeId, year, month, day, type, timestamp);

      // Convert base64 to blob
      const blob = this.base64ToBlob(photoData);

      // Validate photo size and type
      const validation = await this.validatePhoto(blob);
      if (!validation.isValid) {
        return {
          url: '',
          path: '',
          success: false,
          error: validation.error
        };
      }

      // Compress photo if needed
      const compressedBlob = await this.compressPhoto(blob);

      // Upload to storage
      const { error } = await supabase.storage
        .from('attendance')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '31536000', // 1 year
          upsert: false
        });

      if (error) {
        console.error('Error uploading photo:', error);
        return {
          url: '',
          path: '',
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attendance')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
        success: true
      };
    } catch (error) {
      console.error('Error uploading photo to storage:', error);
      return {
        url: '',
        path: '',
        success: false,
        error: 'Failed to upload photo to storage'
      };
    }
  }

  /**
   * Delete photo from storage
   */
  async deletePhoto(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate input
      if (!filePath || filePath.trim() === '') {
        return {
          success: false,
          error: 'File path is required'
        };
      }

      const supabase = await createClient();

      const { error } = await supabase.storage
        .from('attendance')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting photo:', error);
        return {
          success: false,
          error: `Delete failed: ${error.message}`
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting photo from storage:', error);
      return {
        success: false,
        error: 'Failed to delete photo from storage'
      };
    }
  }

  /**
   * Get photo public URL
   */
  async getPhotoUrl(filePath: string): Promise<{ url: string; success: boolean; error?: string }> {
    try {
      // Validate input
      if (!filePath || filePath.trim() === '') {
        return {
          url: '',
          success: false,
          error: 'File path is required'
        };
      }

      const supabase = await createClient();

      const { data: { publicUrl } } = supabase.storage
        .from('attendance')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        success: true
      };
    } catch (error) {
      console.error('Error getting photo URL:', error);
      return {
        url: '',
        success: false,
        error: 'Failed to get photo URL'
      };
    }
  }

  /**
   * Process face recognition and return confidence score
   */
  async processFaceRecognition(
    _photoData: string,
    _employeeId: string
  ): Promise<{ confidence: number; success: boolean; error?: string }> {
    try {
      // This is a placeholder for face recognition processing
      // In production, you would integrate with a face recognition service
      // such as AWS Rekognition, Azure Face API, or on-device TensorFlow Lite

      // For now, return a mock confidence score
      const mockConfidence = Math.random() * 0.3 + 0.7; // Random between 0.7-1.0

      return {
        confidence: mockConfidence,
        success: true
      };
    } catch (error) {
      console.error('Error processing face recognition:', error);
      return {
        confidence: 0,
        success: false,
        error: 'Failed to process face recognition'
      };
    }
  }

  /**
   * Generate organized file path
   */
  private generateFilePath(
    employeeId: string,
    year: number,
    month: string,
    day: string,
    type: string,
    timestamp: number
  ): string {
    if (type === 'reference') {
      return `employees/reference/${employeeId}-${timestamp}.jpg`;
    }
    return `attendance/${year}/${month}/${day}/${employeeId}/${type}-${timestamp}.jpg`;
  }

  /**
   * Convert base64 string to Blob
   */
  private base64ToBlob(base64Data: string): Blob {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/jpeg' });
  }

  /**
   * Validate photo format (no strict size check - client handles compression)
   */
  private async validatePhoto(blob: Blob): Promise<{ isValid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Check dimensions (minimum 200x200)
        if (img.width < 200 || img.height < 200) {
          resolve({
            isValid: false,
            error: 'Image too small. Minimum size is 200x200 pixels.'
          });
          return;
        }

        // No strict file size check - client handles aggressive compression
        // Only basic validation that it's a valid image

        resolve({ isValid: true });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          isValid: false,
          error: 'Invalid image format.'
        });
      };

      img.src = url;
    });
  }

  /**
   * Store photo as-is (client should handle compression)
   */
  private async compressPhoto(blob: Blob): Promise<Blob> {
    // Client handles compression, so just return the original blob
    return blob;
  }

  /**
   * Generate photo thumbnail
   */
  async generateThumbnail(
    photoData: string,
    maxWidth: number = 200,
    maxHeight: number = 200
  ): Promise<{ thumbnail: string; success: boolean; error?: string }> {
    try {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const url = `data:image/jpeg;base64,${photoData}`;

        img.onload = () => {
          URL.revokeObjectURL(url);

          // Calculate thumbnail dimensions
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > height) {
            if (width > maxWidth) {
              width = maxWidth;
              height = width / aspectRatio;
            }
          } else {
            if (height > maxHeight) {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw thumbnail
          ctx?.drawImage(img, 0, 0, width, height);

          const thumbnailData = canvas.toDataURL('image/jpeg', 0.8);

          // Extract base64 data (remove data URL prefix)
          const base64Data = thumbnailData.replace(/^data:image\/[a-z]+;base64,/, '');

          resolve({
            thumbnail: base64Data,
            success: true
          });
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({
            thumbnail: '',
            success: false,
            error: 'Failed to generate thumbnail'
          });
        };

        img.src = url;
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return {
        thumbnail: '',
        success: false,
        error: 'Failed to generate thumbnail'
      };
    }
  }
}

// Export singleton instance
export const photoService = new PhotoService();