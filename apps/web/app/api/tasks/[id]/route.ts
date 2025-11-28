import { NextRequest, NextResponse } from 'next/server';
import {
  getTaskById,
  updateTask
} from '@/services/task.service';
import {
  UpdateTaskRequest,
  UpdateTaskRequestSchema,
  TaskResponseSchema
} from '@pgn/shared';
import { withSecurity, addSecurityHeaders, AuthenticatedRequest } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { z } from 'zod';
import { apiContract } from '@pgn/shared';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema for route parameters
const TaskIdParamsSchema = z.object({
  id: z.string().min(1, 'Task ID is required')
});

const getTaskHandler = async (
  request: NextRequest,
  context: { params?: any }
): Promise<NextResponse> => {
  const params = await context.params || { id: '' };
  try {
    const authenticatedRequest = request as AuthenticatedRequest;
    const user = authenticatedRequest.user;

    // Use validated parameters from middleware
    const { id } = (request as NextRequest & { validatedParams: { id: string } }).validatedParams || await params;

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
  context: { params?: any }
): Promise<NextResponse> => {
  const params = await context.params || { id: '' };
  try {
    // Use validated parameters and body from middleware
    const { id } = (request as NextRequest & { validatedParams: { id: string } }).validatedParams || await params;
    const body = (request as NextRequest & { validatedBody: UpdateTaskRequest }).validatedBody;

    // RLS policies will handle authorization at database level
    // Try admin update first (allows all fields)
    const updateData: UpdateTaskRequest = {
      title: body.title?.trim(),
      description: body.description?.trim(),
      status: body.status,
      priority: body.priority,
      progress: body.progress,
      due_date: body.due_date ? new Date(body.due_date) : undefined,
      completion_notes: body.completion_notes?.trim(),
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

// Add route definitions to API contract
apiContract.addRoute({
  path: '/api/tasks/[id]',
  method: 'GET',
  inputSchema: TaskIdParamsSchema,
  outputSchema: TaskResponseSchema,
  description: 'Get a specific task by ID',
  requiresAuth: true
});

apiContract.addRoute({
  path: '/api/tasks/[id]',
  method: 'PUT',
  inputSchema: UpdateTaskRequestSchema,
  outputSchema: TaskResponseSchema,
  description: 'Update a specific task',
  requiresAuth: true
});

export const GET = withSecurity(withApiValidation(getTaskHandler, {
  params: TaskIdParamsSchema,
  response: TaskResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));

export const PUT = withSecurity(withApiValidation(updateTaskHandler, {
  params: TaskIdParamsSchema,
  body: UpdateTaskRequestSchema,
  response: TaskResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));