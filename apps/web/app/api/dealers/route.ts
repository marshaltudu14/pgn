import { NextRequest, NextResponse } from 'next/server';
import {
  listDealers,
  createDealer
} from '@/services/dealer.service';
import { DealerInsert } from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

const getDealersHandler = async (request: NextRequest): Promise<NextResponse> => {
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
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
    };

    const result = await listDealers(params);

    const response = NextResponse.json({
      success: true,
      data: {
        dealers: result.dealers,
        pagination: result.pagination
      },
      message: 'Dealers retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dealers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const createDealerHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const dealerData: DealerInsert = {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      shop_name: body.shop_name || null,
      email: body.email || null,
    };

    const result = await createDealer(dealerData);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Dealer created successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating dealer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to create dealer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

export const GET = withSecurity(getDealersHandler);
export const POST = withSecurity(createDealerHandler);