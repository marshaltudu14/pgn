import { NextRequest, NextResponse } from 'next/server';
import {
  createTask,
  listTasks
} from '@/services/task.service';
import {
  CreateTaskRequest,
  TaskListParams,
  TaskListParamsSchema,
  CreateTaskRequestSchema,
  TaskListResponseSchema,
  TaskResponseSchema
} from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { apiContract } from '@pgn/shared';

const getTasksHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Use validated query parameters from middleware
    const params = (request as NextRequest & { validatedQuery: TaskListParams }).validatedQuery;

    // The RLS policies will automatically handle role-based filtering at the database level
    const result = await listTasks(params);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Tasks retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tasks',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const createTaskHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Use validated body from middleware
    const body = (request as NextRequest & { validatedBody: CreateTaskRequest }).validatedBody;

    // Create task request - the RLS policies will handle permission checking
    const createData: CreateTaskRequest = {
      title: body.title.trim(),
      description: body.description?.trim() || undefined,
      assigned_employee_id: body.assigned_employee_id,
      priority: body.priority || 'MEDIUM',
      due_date: body.due_date ? new Date(body.due_date) : undefined,
    };

    const result = await createTask(createData);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Task created successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating task:', error);

    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Failed to create task')) {
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
        error: 'Failed to create task',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

// Add route definitions to API contract
apiContract.addRoute({
  path: '/api/tasks',
  method: 'GET',
  inputSchema: TaskListParamsSchema,
  outputSchema: TaskListResponseSchema,
  description: 'List tasks with pagination and filtering',
  requiresAuth: true
});

apiContract.addRoute({
  path: '/api/tasks',
  method: 'POST',
  inputSchema: CreateTaskRequestSchema,
  outputSchema: TaskResponseSchema,
  description: 'Create a new task',
  requiresAuth: true
});

export const GET = withSecurity(withApiValidation(getTasksHandler, {
  query: TaskListParamsSchema,
  response: TaskListResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));

export const POST = withSecurity(withApiValidation(createTaskHandler, {
  body: CreateTaskRequestSchema,
  response: TaskResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));