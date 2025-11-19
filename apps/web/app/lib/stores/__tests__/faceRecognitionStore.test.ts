/**
 * Unit tests for Face Recognition Store using Jest
 */

import { useFaceRecognitionStore } from '../faceRecognitionStore';
import { GenerateEmbeddingResponse, PerformanceMetrics, FaceDetectionResult, FaceQualityResult } from '@pgn/shared';

// Mock the face recognition client
jest.mock('@/lib/face-recognition-client', () => ({
  generateEmbeddingClientSide: jest.fn(),
  initializeClientModels: jest.fn(),
  areModelsInitialized: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('useFaceRecognitionStore', () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const mockEmployeeId = 'emp-123';

  const mockEmbedding = new Float32Array(128).fill(0.5);
  const mockDetection: FaceDetectionResult = {
    detected: true,
    confidence: 0.95,
    faceCount: 1,
    faceRect: { x: 50, y: 50, width: 100, height: 100 }
  };
  const mockQuality: FaceQualityResult = {
    overall: 'excellent' as const,
    brightness: 0.6,
    contrast: 0.7,
    sharpness: 0.8,
    faceSize: 0.4,
    issues: []
  };
  const mockPerformance: PerformanceMetrics = {
    clientSide: { duration: 150, embeddingGeneration: 120 },
    serverSide: { duration: 80, serverProcessing: 60 },
    total: { duration: 230 }
  };

  const mockClientSuccessResponse: GenerateEmbeddingResponse = {
    success: true,
    embedding: mockEmbedding,
    detection: mockDetection,
    quality: mockQuality,
    performance: mockPerformance
  };

  const mockClientFailureResponse: GenerateEmbeddingResponse = {
    success: false,
    error: 'No face detected in the image'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset store state
    const store = useFaceRecognitionStore.getState();
    (store as any).isProcessing = false;
    (store as any).isInitializing = false;
    (store as any).modelsInitialized = false;
    (store as any).lastResult = null;
    (store as any).error = null;
  });

  afterEach(() => {
    // Reset fetch mock
    (fetch as jest.Mock).mockReset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useFaceRecognitionStore.getState();

      expect(state.isProcessing).toBe(false);
      expect(state.isInitializing).toBe(false);
      expect(state.modelsInitialized).toBe(false);
      expect(state.lastResult).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('store methods availability', () => {
    it('should have all required methods', () => {
      const store = useFaceRecognitionStore.getState();

      expect(typeof store.clearError).toBe('function');
      expect(typeof store.initializeModels).toBe('function');
      expect(typeof store.generateEmbedding).toBe('function');
      expect(typeof store.saveEmbeddingToServer).toBe('function');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const store = useFaceRecognitionStore.getState();

      // Set an error first
      store.setError('Test error');
      expect(useFaceRecognitionStore.getState().error).toBe('Test error');

      // Clear the error
      store.clearError();
      expect(useFaceRecognitionStore.getState().error).toBeNull();
    });
  });

  describe('initializeModels', () => {
    it('should successfully initialize models when not already initialized', async () => {
      const { areModelsInitialized, initializeClientModels } = require('@/lib/face-recognition-client');
      (areModelsInitialized as jest.Mock).mockReturnValue(false);
      (initializeClientModels as jest.Mock).mockResolvedValue(undefined);

      const store = useFaceRecognitionStore.getState();
      await store.initializeModels();

      expect(useFaceRecognitionStore.getState().isInitializing).toBe(false);
      expect(useFaceRecognitionStore.getState().modelsInitialized).toBe(true);
      expect(useFaceRecognitionStore.getState().error).toBeNull();
      expect(initializeClientModels).toHaveBeenCalledTimes(1);
    });

    it('should not initialize models when already initialized', async () => {
      const { areModelsInitialized, initializeClientModels } = require('@/lib/face-recognition-client');
      (areModelsInitialized as jest.Mock).mockReturnValue(true);

      const store = useFaceRecognitionStore.getState();
      await store.initializeModels();

      expect(useFaceRecognitionStore.getState().isInitializing).toBe(false);
      expect(useFaceRecognitionStore.getState().modelsInitialized).toBe(false); // Stays false because initialize() not called
      expect(useFaceRecognitionStore.getState().error).toBeNull();
      expect(initializeClientModels).not.toHaveBeenCalled();
    });

    it('should handle initialization error', async () => {
      const { areModelsInitialized, initializeClientModels } = require('@/lib/face-recognition-client');
      (areModelsInitialized as jest.Mock).mockReturnValue(false);
      (initializeClientModels as jest.Mock).mockRejectedValue(new Error('Model loading failed'));

      const store = useFaceRecognitionStore.getState();

      await expect(store.initializeModels()).rejects.toThrow('Model loading failed');

      expect(useFaceRecognitionStore.getState().isInitializing).toBe(false);
      expect(useFaceRecognitionStore.getState().modelsInitialized).toBe(false);
      expect(useFaceRecognitionStore.getState().error).toBe('Model loading failed');
    });

    it('should set initializing state during model initialization', async () => {
      const { areModelsInitialized, initializeClientModels } = require('@/lib/face-recognition-client');
      (areModelsInitialized as jest.Mock).mockReturnValue(false);

      let resolveInitialize: (value: any) => void;
      (initializeClientModels as jest.Mock).mockReturnValueOnce(new Promise(resolve => {
        resolveInitialize = resolve;
      }));

      const store = useFaceRecognitionStore.getState();
      const initPromise = store.initializeModels();

      // Should be initializing
      expect(useFaceRecognitionStore.getState().isInitializing).toBe(true);

      // Resolve initialization
      resolveInitialize(undefined);
      await initPromise;

      // Should not be initializing anymore
      expect(useFaceRecognitionStore.getState().isInitializing).toBe(false);
      expect(useFaceRecognitionStore.getState().modelsInitialized).toBe(true);
    });
  });

  describe('generateEmbedding', () => {
    it('should successfully generate embedding without saving to server', async () => {
      const { areModelsInitialized } = require('@/lib/face-recognition-client');
      const { generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(true);
      (generateEmbeddingClientSide as jest.Mock).mockResolvedValue(mockClientSuccessResponse);

      const store = useFaceRecognitionStore.getState();
      const result = await store.generateEmbedding(mockFile);

      expect(result.success).toBe(true);
      expect(result.embedding).toEqual(Array.from(mockEmbedding));
      expect(result.detection).toEqual(mockDetection);
      expect(result.quality).toEqual(mockQuality);

      expect(useFaceRecognitionStore.getState().isProcessing).toBe(false);
      expect(useFaceRecognitionStore.getState().lastResult).toEqual({
        success: true,
        embedding: Array.from(mockEmbedding),
        detection: mockDetection,
        quality: mockQuality
      });
      expect(useFaceRecognitionStore.getState().error).toBeNull();

      expect(generateEmbeddingClientSide).toHaveBeenCalledWith(mockFile);
      expect(fetch).not.toHaveBeenCalled(); // Should not call server when no employeeId
    });

    it('should successfully generate embedding and save to server', async () => {
      const { areModelsInitialized } = require('@/lib/face-recognition-client');
      const { generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(true);
      (generateEmbeddingClientSide as jest.Mock).mockResolvedValue(mockClientSuccessResponse);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          embedding: Array.from(mockEmbedding),
          detection: mockDetection,
          quality: mockQuality
        }),
      });

      const store = useFaceRecognitionStore.getState();
      const result = await store.generateEmbedding(mockFile, mockEmployeeId);

      expect(result.success).toBe(true);
      expect(result.embedding).toEqual(Array.from(mockEmbedding));

      expect(useFaceRecognitionStore.getState().isProcessing).toBe(false);
      expect(useFaceRecognitionStore.getState().lastResult).toEqual({
        success: true,
        embedding: Array.from(mockEmbedding),
        detection: mockDetection,
        quality: mockQuality
      });
      expect(useFaceRecognitionStore.getState().error).toBeNull();

      expect(fetch).toHaveBeenCalledWith('/api/face-recognition/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embedding: Array.from(mockEmbedding),
          employeeId: mockEmployeeId,
          detection: mockDetection,
          quality: mockQuality,
          performance: mockPerformance
        }),
      });
    });

    it('should auto-initialize models when not initialized', async () => {
      const { areModelsInitialized, initializeClientModels, generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(false);
      (initializeClientModels as jest.Mock).mockResolvedValue(undefined);
      (generateEmbeddingClientSide as jest.Mock).mockResolvedValue(mockClientSuccessResponse);

      const store = useFaceRecognitionStore.getState();
      await store.generateEmbedding(mockFile);

      expect(initializeClientModels).toHaveBeenCalled();
      expect(generateEmbeddingClientSide).toHaveBeenCalled();
    });

    it('should handle client-side face recognition failure', async () => {
      const { areModelsInitialized } = require('@/lib/face-recognition-client');
      const { generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(true);
      (generateEmbeddingClientSide as jest.Mock).mockResolvedValue(mockClientFailureResponse);

      const store = useFaceRecognitionStore.getState();
      const result = await store.generateEmbedding(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No face detected in the image');

      expect(useFaceRecognitionStore.getState().isProcessing).toBe(false);
      expect(useFaceRecognitionStore.getState().lastResult).toEqual(mockClientFailureResponse);
      expect(useFaceRecognitionStore.getState().error).toBe('No face detected in the image');

      expect(fetch).not.toHaveBeenCalled(); // Should not call server when client fails
    });

    it('should handle server-side saving error', async () => {
      const { areModelsInitialized } = require('@/lib/face-recognition-client');
      const { generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(true);
      (generateEmbeddingClientSide as jest.Mock).mockResolvedValue(mockClientSuccessResponse);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'Server error while saving embedding'
        }),
      });

      const store = useFaceRecognitionStore.getState();
      const result = await store.generateEmbedding(mockFile, mockEmployeeId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP error! status: 500');

      expect(useFaceRecognitionStore.getState().isProcessing).toBe(false);
      expect(useFaceRecognitionStore.getState().error).toContain('HTTP error! status: 500');
    });

    it('should handle network error during embedding generation', async () => {
      const { areModelsInitialized } = require('@/lib/face-recognition-client');
      const { generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(true);
      (generateEmbeddingClientSide as jest.Mock).mockRejectedValue(new Error('Network error'));

      const store = useFaceRecognitionStore.getState();
      const result = await store.generateEmbedding(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');

      expect(useFaceRecognitionStore.getState().isProcessing).toBe(false);
      expect(useFaceRecognitionStore.getState().error).toBe('Network error');
    });

    it('should set processing state during embedding generation', async () => {
      const { areModelsInitialized, generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(true);

      let resolveGenerate: (value: any) => void;
      (generateEmbeddingClientSide as jest.Mock).mockReturnValueOnce(new Promise(resolve => {
        resolveGenerate = resolve;
      }));

      const store = useFaceRecognitionStore.getState();
      const generatePromise = store.generateEmbedding(mockFile);

      // Should be processing
      expect(useFaceRecognitionStore.getState().isProcessing).toBe(true);

      // Resolve generation
      resolveGenerate(mockClientSuccessResponse);
      await generatePromise;

      // Should not be processing anymore
      expect(useFaceRecognitionStore.getState().isProcessing).toBe(false);
    });

    it('should handle case when embedding is null in client response', async () => {
      const { areModelsInitialized, generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(true);

      const responseWithNullEmbedding: GenerateEmbeddingResponse = {
        success: true,
        embedding: null,
        detection: mockDetection,
        quality: mockQuality
      };

      (generateEmbeddingClientSide as jest.Mock).mockResolvedValue(responseWithNullEmbedding);

      const store = useFaceRecognitionStore.getState();
      const result = await store.generateEmbedding(mockFile, mockEmployeeId);

      // According to the source code, when embedding is null, Array.from(null) will throw an error
      // so the function should go to the catch block
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy(); // Should have an error
      expect(fetch).not.toHaveBeenCalled(); // Should not call server when embedding is null
    });
  });

  describe('saveEmbeddingToServer', () => {
    it('should successfully save embedding to server', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          embedding: Array.from(mockEmbedding),
          detection: mockDetection,
          quality: mockQuality
        }),
      });

      const store = useFaceRecognitionStore.getState();
      const result = await store.saveEmbeddingToServer(
        mockEmbedding,
        mockEmployeeId,
        mockDetection,
        mockQuality,
        mockPerformance
      );

      expect(result.success).toBe(true);
      expect(result.embedding).toEqual(Array.from(mockEmbedding));

      expect(fetch).toHaveBeenCalledWith('/api/face-recognition/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embedding: Array.from(mockEmbedding),
          employeeId: mockEmployeeId,
          detection: mockDetection,
          quality: mockQuality,
          performance: mockPerformance
        }),
      });
    });

    it('should handle HTTP error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const store = useFaceRecognitionStore.getState();
      const result = await store.saveEmbeddingToServer(mockEmbedding, mockEmployeeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP error! status: 404');
    });

    it('should handle network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network connection failed'));

      const store = useFaceRecognitionStore.getState();
      const result = await store.saveEmbeddingToServer(mockEmbedding, mockEmployeeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network connection failed');
    });

    it('should handle missing optional parameters', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          embedding: Array.from(mockEmbedding),
        }),
      });

      const store = useFaceRecognitionStore.getState();
      const result = await store.saveEmbeddingToServer(mockEmbedding, mockEmployeeId);

      expect(result.success).toBe(true);

      expect(fetch).toHaveBeenCalledWith('/api/face-recognition/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embedding: Array.from(mockEmbedding),
          employeeId: mockEmployeeId,
          detection: undefined,
          quality: undefined,
          performance: undefined
        }),
      });
    });

    it('should convert Float32Array to regular array', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          embedding: Array.from(mockEmbedding),
        }),
      });

      const store = useFaceRecognitionStore.getState();
      await store.saveEmbeddingToServer(mockEmbedding, mockEmployeeId);

      const bodyArg = (fetch as jest.Mock).mock.calls[0][1].body;
      const parsedBody = JSON.parse(bodyArg);

      expect(Array.isArray(parsedBody.embedding)).toBe(true);
      expect(parsedBody.embedding).toEqual(Array.from(mockEmbedding));
    });
  });

  describe('state persistence and updates', () => {
    it('should update lastResult after successful embedding generation', async () => {
      const { areModelsInitialized, generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(true);
      (generateEmbeddingClientSide as jest.Mock).mockResolvedValue(mockClientSuccessResponse);

      const store = useFaceRecognitionStore.getState();
      await store.generateEmbedding(mockFile);

      const lastResult = useFaceRecognitionStore.getState().lastResult;
      expect(lastResult).toEqual({
        success: true,
        embedding: Array.from(mockEmbedding),
        detection: mockDetection,
        quality: mockQuality
      });
    });

    it('should update error state after failed embedding generation', async () => {
      const { areModelsInitialized, generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      (areModelsInitialized as jest.Mock).mockReturnValue(true);
      (generateEmbeddingClientSide as jest.Mock).mockRejectedValue(new Error('Processing failed'));

      const store = useFaceRecognitionStore.getState();
      await store.generateEmbedding(mockFile);

      expect(useFaceRecognitionStore.getState().error).toBe('Processing failed');
    });

    it('should clear previous error when starting new operation', async () => {
      const { areModelsInitialized, generateEmbeddingClientSide } = require('@/lib/face-recognition-client');

      // Set initial error state
      const store = useFaceRecognitionStore.getState();
      (store as any).setError('Previous error');
      expect(useFaceRecognitionStore.getState().error).toBe('Previous error');

      // Start new operation
      (areModelsInitialized as jest.Mock).mockReturnValue(true);
      (generateEmbeddingClientSide as jest.Mock).mockResolvedValue(mockClientSuccessResponse);

      await store.generateEmbedding(mockFile);

      // Error should be cleared
      expect(useFaceRecognitionStore.getState().error).toBeNull();
    });
  });
});

// Add helper methods to store for testing
beforeAll(() => {
  const store = useFaceRecognitionStore.getState();
  (store as any).setError = (error: string) => {
    useFaceRecognitionStore.setState({ error });
  };
});