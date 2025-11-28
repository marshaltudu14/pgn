import { NextRequest, NextResponse } from 'next/server';
import {
  getFarmerById,
  updateFarmer,
  deleteFarmer
} from '@/services/farmer.service';
import { FarmerUpdate } from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

const getFarmerHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  try {
    const { id } = await params;
    const farmer = await getFarmerById(id);

    const response = NextResponse.json(farmer);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching farmer:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to fetch farmer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 404 }
    );
    return addSecurityHeaders(response);
  }
};

const updateFarmerHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  try {
    const { id } = await params;
    const body = await request.json();
    const farmerData: FarmerUpdate = {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      farm_name: body.farm_name || null,
      email: body.email || null,
      retailer_id: body.retailer_id,
    };

    const result = await updateFarmer(id, farmerData);

    const response = NextResponse.json(result);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error updating farmer:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to update farmer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const deleteFarmerHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  try {
    const { id } = await params;
    await deleteFarmer(id);

    const response = NextResponse.json({ success: true });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error deleting farmer:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to delete farmer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

export const GET = withSecurity(getFarmerHandler);
export const PUT = withSecurity(updateFarmerHandler);
export const DELETE = withSecurity(deleteFarmerHandler);