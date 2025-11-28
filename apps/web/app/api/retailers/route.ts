import { NextRequest, NextResponse } from 'next/server';
import {
  listRetailers,
  createRetailer
} from '@/services/retailer.service';
import { RetailerInsert } from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

const getRetailersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('itemsPerPage') || searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      shop_name: searchParams.get('shop_name') || undefined,
      email: searchParams.get('email') || undefined,
      phone: searchParams.get('phone') || undefined,
      dealer_id: searchParams.get('dealer_id') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
    };

    const result = await listRetailers(params);

    const response = NextResponse.json({
      retailers: result.retailers,
      pagination: result.pagination
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching retailers:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to fetch retailers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const createRetailerHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const retailerData: RetailerInsert = {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      shop_name: body.shop_name || null,
      email: body.email || null,
      dealer_id: body.dealer_id,
    };

    const result = await createRetailer(retailerData);

    const response = NextResponse.json(result);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating retailer:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to create retailer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

export const GET = withSecurity(getRetailersHandler);
export const POST = withSecurity(createRetailerHandler);