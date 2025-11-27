import { NextRequest, NextResponse } from 'next/server';
import {
  getTaskById,
  updateTask
} from '@/services/task.service';
import { UpdateTaskRequest } from '@pgn/shared';
import { withSecurity, addSecurityHeaders, AuthenticatedRequest } from '@/lib/security-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const getTaskHandler = async (
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> => {
  try {
    const authenticatedRequest = request as AuthenticatedRequest;
    const user = authenticatedRequest.user;
    const { id } = await params;

    const result = await getTaskById(id);

    // For employees, only allow viewing their own assigned tasks
    if (user?.sub && user?.sub !== result.assigned_employee_id) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Access denied - you can only view your assigned tasks'
        },
        { status: 403 }
      );
      return addSecurityHeaders(response);
    }

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Task retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching task:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 404 }
    );
    return addSecurityHeaders(response);
  }
};

const updateTaskHandler = async (
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> => {
  try {
    const { id } = await params;
    const body = await request.json();

    // RLS policies will handle authorization at database level
    // Try admin update first (allows all fields)
    const updateData: UpdateTaskRequest = {
      title: body.title?.trim(),
      description: body.description?.trim(),
      status: body.status,
      priority: body.priority,
      progress: body.progress,
      due_date: body.due_date ? new Date(body.due_date) : undefined,
      completion_notes: body.completionNotes?.trim(),
    };

    const result = await updateTask(id, updateData);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Task updated successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error updating task:', error);

    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Task not found')) {
        const response = NextResponse.json(
          {
            success: false,
            error: error.message
          },
          { status: 404 }
        );
        return addSecurityHeaders(response);
      }

      if (error.message.includes('Failed to update task')) {
        const response = NextResponse.json(
          {
            success: false,
            error: error.message
          },
          { status: 400 }
        );
        return addSecurityHeaders(response);
      }
    }

    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to update task',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

export const GET = withSecurity(getTaskHandler);
export const PUT = withSecurity(updateTaskHandler);