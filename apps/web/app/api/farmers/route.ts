import { NextRequest, NextResponse } from 'next/server';
import {
  listFarmers,
  createFarmer
} from '@/services/farmer.service';
import { FarmerInsert } from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

const getFarmersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('itemsPerPage') || searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      farm_name: searchParams.get('farm_name') || undefined,
      email: searchParams.get('email') || undefined,
      phone: searchParams.get('phone') || undefined,
      retailer_id: searchParams.get('retailer_id') || undefined,
      dealer_id: searchParams.get('dealer_id') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
    };

    const result = await listFarmers(params);

    const response = NextResponse.json({
      success: true,
      data: {
        farmers: result.farmers,
        pagination: result.pagination
      },
      message: 'Farmers retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching farmers:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch farmers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const createFarmerHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const farmerData: FarmerInsert = {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      farm_name: body.farm_name || null,
      email: body.email || null,
      retailer_id: body.retailer_id,
    };

    const result = await createFarmer(farmerData);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Farmer created successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating farmer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to create farmer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

export const GET = withSecurity(getFarmersHandler);
export const POST = withSecurity(createFarmerHandler);