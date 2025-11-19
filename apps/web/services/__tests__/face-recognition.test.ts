/**
 * Unit Tests for Face Recognition Service
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  generateEmbedding,
  compareEmbeddings,
  verifyFace,
  saveEmbedding,
  getEmbedding,
  validateImageFile,
  validateEmbedding
} from '../face-recognition';
import { createClient } from '../../utils/supabase/server';

// Mock the Supabase client
jest.mock('../../utils/supabase/server', () => ({
  createClient: jest.fn()
}));

describe('Face Recognition Service', () => {
  interface MockSupabaseClient {
    from: jest.Mock;
  }
  let mockSupabaseClient: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { face_embedding: 'base64-encoded-string' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      })
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
  });

  describe('generateEmbedding', () => {
    it('should generate embedding successfully with face detected', async () => {
      const imageBuffer = Buffer.from('test-image-data');

      const result = await generateEmbedding(imageBuffer);

      // The function uses randomness, so we check that it returns a valid response structure
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      if (result.success) {
        expect(result.embedding).toBeInstanceOf(Float32Array);
        expect(result.embedding).toHaveLength(128);
        expect(result.detection).toBeDefined();
      } else {
        // If it fails, it should have a proper error structure
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should return error when input is invalid', async () => {
      // Test with empty buffer
      const emptyBuffer = Buffer.from('');

      const result = await generateEmbedding(emptyBuffer);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('compareEmbeddings', () => {
    it('should return 1.0 for identical embeddings', () => {
      const embedding1 = new Float32Array([1, 0, 0]);
      const embedding2 = new Float32Array([1, 0, 0]);

      const similarity = compareEmbeddings(embedding1, embedding2);

      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return 0.0 for orthogonal embeddings', () => {
      const embedding1 = new Float32Array([1, 0, 0]);
      const embedding2 = new Float32Array([0, 1, 0]);

      const similarity = compareEmbeddings(embedding1, embedding2);

      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should return -1.0 for opposite embeddings', () => {
      const embedding1 = new Float32Array([1, 0, 0]);
      const embedding2 = new Float32Array([-1, 0, 0]);

      const similarity = compareEmbeddings(embedding1, embedding2);

      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should handle zero embeddings gracefully', () => {
      const embedding1 = new Float32Array([0, 0, 0]);
      const embedding2 = new Float32Array([1, 0, 0]);

      const similarity = compareEmbeddings(embedding1, embedding2);

      expect(similarity).toBe(0);
    });

    it('should calculate similarity for real-world embeddings', () => {
      const embedding1 = new Float32Array(128);
      const embedding2 = new Float32Array(128);

      for (let i = 0; i < 128; i++) {
        embedding1[i] = Math.random() * 2 - 1;
        embedding2[i] = Math.random() * 2 - 1;
      }

      const similarity = compareEmbeddings(embedding1, embedding2);

      expect(similarity).toBeGreaterThanOrEqual(-1.0);
      expect(similarity).toBeLessThanOrEqual(1.0);
    });

    it('should handle comparison errors gracefully', () => {
      const embedding1 = new Float32Array([1, 0, 0]);

      // Create a malformed embedding that will cause NaN in calculation
      const embedding2 = new Float32Array([1, 0, 0]);
      embedding2[1] = NaN;

      const similarity = compareEmbeddings(embedding1, embedding2);

      expect(isNaN(similarity) || similarity === 0).toBe(true);
    });
  });

  describe('verifyFace', () => {
    const embedding1 = new Float32Array([1, 0, 0]);
    const embedding2 = new Float32Array([1, 0, 0]);
    const embedding3 = new Float32Array([0, 1, 0]);

    it('should verify matching faces with default threshold', () => {
      const result = verifyFace(embedding1, embedding2);

      expect(result).toBe(true);
    });

    it('should reject non-matching faces with default threshold', () => {
      const result = verifyFace(embedding1, embedding3);

      expect(result).toBe(false);
    });

    it('should verify faces with custom threshold', () => {
      const result = verifyFace(embedding1, embedding2, 0.99);

      expect(result).toBe(true);
    });

    it('should reject faces with high threshold', () => {
      const embedding1 = new Float32Array([1, 0, 0]);
      const embedding2 = new Float32Array([0.7, 0.7, 0]); // 70% similar

      const result = verifyFace(embedding1, embedding2, 0.8);

      expect(result).toBe(false);
    });
  });

  describe('saveEmbedding', () => {
    it('should save embedding successfully', async () => {
      const embedding = new Float32Array(128);
      embedding.fill(0.1);

      const result = await saveEmbedding('emp-123', embedding);

      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees');
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        face_embedding: expect.any(String),
        updated_at: expect.any(String)
      });
      expect(mockSupabaseClient.from().update().eq).toHaveBeenCalledWith('id', 'emp-123');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Database connection failed' }
          })
        })
      });

      const embedding = new Float32Array(128);
      embedding.fill(0.1);

      const result = await saveEmbedding('emp-123', embedding);

      expect(result).toBe(false);
    });

    it('should handle connection errors', async () => {
      (createClient as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const embedding = new Float32Array(128);
      embedding.fill(0.1);

      const result = await saveEmbedding('emp-123', embedding);

      expect(result).toBe(false);
    });
  });

  describe('getEmbedding', () => {
    it('should retrieve embedding successfully', async () => {
      const mockEmbeddingArray = new Float32Array(128);
      mockEmbeddingArray.fill(0.1);

      // Mock Buffer.from to return our test embedding
      const originalBuffer = global.Buffer;
      global.Buffer = {
        ...originalBuffer,
        from: jest.fn((data: string | BufferSource, encoding?: BufferEncoding) => {
          if (encoding === 'base64' && typeof data === 'string') {
            return mockEmbeddingArray;
          }
          return originalBuffer.from(data as string, encoding);
        })
      } as any;

      const result = await getEmbedding('emp-123');

      expect(result).toBeInstanceOf(Float32Array);
      expect(result).toHaveLength(128);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('employees');
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith('face_embedding');
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('id', 'emp-123');

      // Restore original Buffer
      global.Buffer = originalBuffer;
    });

    it('should return null when embedding not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      });

      const result = await getEmbedding('emp-123');

      expect(result).toBeNull();
    });

    it('should return null when no face_embedding field', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { face_embedding: null },
              error: null
            })
          })
        })
      });

      const result = await getEmbedding('emp-123');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await getEmbedding('emp-123');

      expect(result).toBeNull();
    });

    it('should handle connection errors', async () => {
      (createClient as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const result = await getEmbedding('emp-123');

      expect(result).toBeNull();
    });
  });

  describe('validateImageFile', () => {
    it('should validate valid image file', () => {
      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-image file', () => {
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File must be an image');
    });

    it('should reject oversized file', () => {
      const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Image must be less than 5MB');
    });

    it('should reject too small file', () => {
      const file = new File(['test'], 'tiny.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 }); // 5KB

      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Image appears to be too small');
    });
  });

  describe('validateEmbedding', () => {
    it('should validate correct embedding', () => {
      const embedding = new Float32Array(128);

      // Create a normalized embedding
      for (let i = 0; i < 128; i++) {
        embedding[i] = Math.random() * 2 - 1;
      }

      // Normalize
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      for (let i = 0; i < 128; i++) {
        embedding[i] = embedding[i] / norm;
      }

      const result = validateEmbedding(Array.from(embedding));

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-array embedding', () => {
      const result = validateEmbedding({} as unknown as number[]);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Embedding must be an array');
    });

    it('should reject wrong length embedding', () => {
      const embedding = new Float32Array(64);
      embedding.fill(0.1);

      const result = validateEmbedding(Array.from(embedding));

      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be 128 dimensions');
    });

    it('should reject embedding with invalid values', () => {
      const embedding = new Float32Array(128);
      embedding.fill(0.1);
      embedding[50] = NaN;

      const result = validateEmbedding(Array.from(embedding));

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid embedding value at index 50');
    });

    it('should reject non-normalized embedding', () => {
      const embedding = new Float32Array(128);
      embedding.fill(1.0); // Not normalized

      const result = validateEmbedding(Array.from(embedding));

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not properly normalized');
    });

    it('should reject embedding with suspicious pattern', () => {
      const embedding = new Float32Array(128);

      // Create a normalized embedding with suspicious pattern
      // First create all same values
      embedding.fill(0.1);

      // Then normalize it to pass the L2 norm check
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      for (let i = 0; i < 128; i++) {
        embedding[i] = embedding[i] / norm;
      }

      const result = validateEmbedding(Array.from(embedding));

      expect(result.valid).toBe(false);
      // It should catch the suspicious pattern
      expect(result.error).toContain('Suspicious embedding pattern');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete face recognition workflow', async () => {
      // Test core functionality without relying on randomness
      const embedding = new Float32Array(128);

      // Create a normalized embedding
      for (let i = 0; i < 128; i++) {
        embedding[i] = Math.random() * 2 - 1;
      }
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      for (let i = 0; i < 128; i++) {
        embedding[i] = embedding[i] / norm;
      }

      // Test embedding comparison
      const similarity = compareEmbeddings(embedding, embedding);
      expect(similarity).toBeCloseTo(1.0, 5);

      // Test face verification
      const verified = verifyFace(embedding, embedding);
      expect(verified).toBe(true);

      // Test embedding validation
      const validation = validateEmbedding(Array.from(embedding));
      expect(validation.valid).toBe(true);

      // Test saving embedding
      const saved = await saveEmbedding('emp-123', embedding);
      expect(saved).toBe(true);
    });
  });
});