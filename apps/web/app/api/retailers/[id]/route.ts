import { NextRequest, NextResponse } from 'next/server';
import {
  getRetailerById,
  updateRetailer,
  deleteRetailer
} from '@/services/retailer.service';
import { RetailerUpdate } from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

const getRetailerHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  try {
    const { id } = await params;
    const retailer = await getRetailerById(id);

    const response = NextResponse.json(retailer);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching retailer:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to fetch retailer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 404 }
    );
    return addSecurityHeaders(response);
  }
};

const updateRetailerHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  try {
    const { id } = await params;
    const body = await request.json();
    const retailerData: RetailerUpdate = {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      shop_name: body.shop_name || null,
      email: body.email || null,
      dealer_id: body.dealer_id,
    };

    const result = await updateRetailer(id, retailerData);

    const response = NextResponse.json(result);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error updating retailer:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to update retailer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const deleteRetailerHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  try {
    const { id } = await params;
    await deleteRetailer(id);

    const response = NextResponse.json({ success: true });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error deleting retailer:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to delete retailer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

export const GET = withSecurity(getRetailerHandler);
export const PUT = withSecurity(updateRetailerHandler);
export const DELETE = withSecurity(deleteRetailerHandler);