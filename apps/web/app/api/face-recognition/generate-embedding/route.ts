/**
 * API Route: Save Client-Side Generated Face Embedding
 * POST /api/face-recognition/generate-embedding
 * Receives embedding generated on client-side and saves to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveEmbedding, validateEmbedding } from '@/services/face-recognition';
import { GenerateEmbeddingResponse } from '@pgn/shared';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { embedding, employeeId, detection, quality } = body;

    // Validate inputs
    if (!embedding) {
      return NextResponse.json<GenerateEmbeddingResponse>({
        success: false,
        error: 'Embedding is required'
      }, { status: 400 });
    }

    if (!employeeId) {
      return NextResponse.json<GenerateEmbeddingResponse>({
        success: false,
        error: 'Employee ID is required'
      }, { status: 400 });
    }

    // Validate embedding format and quality
    const embeddingValidation = validateEmbedding(embedding);
    if (!embeddingValidation.valid) {
      return NextResponse.json<GenerateEmbeddingResponse>({
        success: false,
        error: embeddingValidation.error
      }, { status: 400 });
    }

    // Convert number array to Float32Array
    const embeddingArray = new Float32Array(embedding);

    // Save embedding to database using service layer
    const saved = await saveEmbedding(employeeId, embeddingArray);
    if (!saved) {
      return NextResponse.json<GenerateEmbeddingResponse>({
        success: false,
        error: 'Failed to save embedding to database',
        embedding: embedding,
        detection,
        quality
      }, { status: 500 });
    }

  
    // Return success response
    return NextResponse.json<GenerateEmbeddingResponse>({
      success: true,
      embedding: embedding,
      detection,
      quality
    });

  } catch (error) {
    console.error('Error in generate-embedding API:', error);
    return NextResponse.json<GenerateEmbeddingResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}