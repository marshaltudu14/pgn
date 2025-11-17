/**
 * Face Recognition Store
 * Manages client-side face recognition state and processing
 */

import { create } from 'zustand';
import { GenerateEmbeddingResponse, PerformanceMetrics } from '@pgn/shared';
import {
  generateEmbeddingClientSide,
  initializeClientModels,
  areModelsInitialized
} from '@/lib/face-recognition-client';

interface FaceRecognitionState {
  isProcessing: boolean;
  isInitializing: boolean;
  modelsInitialized: boolean;
  lastResult: GenerateEmbeddingResponse | null;
  error: string | null;
  clearError: () => void;
  initializeModels: () => Promise<void>;
  generateEmbedding: (image: File, employeeId?: string) => Promise<GenerateEmbeddingResponse>;
  saveEmbeddingToServer: (embedding: Float32Array, employeeId: string, detection?: unknown, quality?: unknown, performance?: PerformanceMetrics) => Promise<GenerateEmbeddingResponse>;
}

export const useFaceRecognitionStore = create<FaceRecognitionState>((set, get) => ({
  isProcessing: false,
  isInitializing: false,
  modelsInitialized: false,
  lastResult: null,
  error: null,

  clearError: () => {
    set({ error: null });
  },

  initializeModels: async () => {
    try {
      set({ isInitializing: true, error: null });

      if (!areModelsInitialized()) {
        await initializeClientModels();
        set({ modelsInitialized: true });
        console.log('Face recognition models initialized successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize face recognition models';
      set({ error: errorMessage, isInitializing: false });
      throw error;
    } finally {
      set({ isInitializing: false });
    }
  },

  generateEmbedding: async (image: File, employeeId?: string): Promise<GenerateEmbeddingResponse> => {
    try {
      set({ isProcessing: true, error: null });

      // Ensure models are initialized
      if (!areModelsInitialized()) {
        await get().initializeModels();
      }

      // Generate embedding client-side
      const clientResult = await generateEmbeddingClientSide(image);

      if (!clientResult.success) {
        const response: GenerateEmbeddingResponse = {
          success: false,
          error: clientResult.error
        };
        set({
          lastResult: response,
          isProcessing: false,
          error: clientResult.error || null
        });
        return response;
      }

      // If employeeId provided, save to server
      if (employeeId && clientResult.embedding) {
        const serverResult = await get().saveEmbeddingToServer(
          clientResult.embedding,
          employeeId,
          clientResult.detection,
          clientResult.quality,
          (clientResult as { performance?: PerformanceMetrics }).performance
        );

        set({
          lastResult: serverResult,
          isProcessing: false,
          error: serverResult.error || null
        });

        return serverResult;
      }

      const response: GenerateEmbeddingResponse = {
        success: true,
        embedding: Array.from(clientResult.embedding!),
        detection: clientResult.detection,
        quality: clientResult.quality
      };

      set({
        lastResult: response,
        isProcessing: false,
        error: null
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate face embedding';
      set({
        isProcessing: false,
        error: errorMessage
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  saveEmbeddingToServer: async (embedding: Float32Array, employeeId: string, detection?: unknown, quality?: unknown, performance?: PerformanceMetrics): Promise<GenerateEmbeddingResponse> => {
    try {
      const response = await fetch('/api/face-recognition/generate-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embedding: Array.from(embedding),
          employeeId,
          detection,
          quality,
          performance
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as GenerateEmbeddingResponse;
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save embedding to server';
      return {
        success: false,
        error: errorMessage
      };
    }
  },
}));