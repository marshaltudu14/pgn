import { NextRequest, NextResponse } from 'next/server';
import {
  getDealerById,
  updateDealer,
  deleteDealer
} from '@/services/dealer.service';
import { DealerUpdate } from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

const getDealerHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  try {
    const { id } = await params;
    const dealer = await getDealerById(id);

    const response = NextResponse.json({
      success: true,
      data: dealer,
      message: 'Dealer retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching dealer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dealer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 404 }
    );
    return addSecurityHeaders(response);
  }
};

const updateDealerHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  try {
    const { id } = await params;
    const body = await request.json();
    const dealerData: DealerUpdate = {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      shop_name: body.shop_name || null,
      email: body.email || null,
    };

    const result = await updateDealer(id, dealerData);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Dealer updated successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error updating dealer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to update dealer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const deleteDealerHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  try {
    const { id } = await params;
    await deleteDealer(id);

    const response = NextResponse.json({
      success: true,
      data: null,
      message: 'Dealer deleted successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error deleting dealer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to delete dealer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

export const GET = withSecurity(getDealerHandler);
export const PUT = withSecurity(updateDealerHandler);
export const DELETE = withSecurity(deleteDealerHandler);