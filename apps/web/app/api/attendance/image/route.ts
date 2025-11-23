/**
 * Generate Signed URL for Attendance Image API
 * Generates temporary signed URLs for accessing private Supabase storage images
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { generateAttendanceImageUrl } from '@/services/attendance.service';

const imageHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Get image path from query parameter
    const { searchParams } = new URL(req.url);
    const imagePath = searchParams.get('path');

    console.log('🔍 [DEBUG] Attendance image API called with path:', imagePath);

    if (!imagePath) {
      console.log('❌ [ERROR] Missing image path parameter in attendance image API');
      const response = NextResponse.json(
        { error: 'Missing image path parameter' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    console.log('🔍 [DEBUG] Generating signed URL for attendance image:', imagePath);

    // Generate signed URL using service layer
    const signedUrl = await generateAttendanceImageUrl(imagePath);

    console.log('✅ [SUCCESS] Generated signed URL successfully for path:', imagePath, 'URL length:', signedUrl.length);

    const response = NextResponse.json({
      signedUrl,
      expiresAt: new Date(Date.now() + 60 * 15 * 1000).toISOString(), // 15 minutes from now
    });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('❌ [ERROR] Error in attendance image API:', error);
    const response = NextResponse.json(
      { error: 'Failed to generate image URL' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

/**
 * Handle unsupported methods
 */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Only GET method is supported for image URL generation'
    },
    { status: 405 }
  );
  return addSecurityHeaders(response);
}

export async function PUT(): Promise<NextResponse> {
  const response = NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Only GET method is supported for image URL generation'
    },
    { status: 405 }
  );
  return addSecurityHeaders(response);
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Only GET method is supported for image URL generation'
    },
    { status: 405 }
  );
  return addSecurityHeaders(response);
}

// Export with security middleware
export const GET = withSecurity(imageHandler);