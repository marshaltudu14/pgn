import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.status || !Object.values(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']).includes(body.status)) {
      return NextResponse.json(
        { error: 'Valid employment status is required' },
        { status: 400 }
      );
    }

    const { status, reason } = body;

    // TODO: Implement actual service layer call
    // const result = await EmployeeService.updateEmploymentStatus(id, status, reason);

    // Mock update for now
    console.log(`Updating employment status for employee ${id} to ${status}`, reason ? `with reason: ${reason}` : '');

    return NextResponse.json({
      success: true,
      message: 'Employment status updated successfully',
      data: {
        employeeId: id,
        newStatus: status,
        reason: reason || null,
        updatedBy: 'current-user', // This would come from auth context
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating employment status:', error);
    return NextResponse.json(
      { error: 'Failed to update employment status' },
      { status: 500 }
    );
  }
}