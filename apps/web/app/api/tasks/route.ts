import { NextRequest, NextResponse } from 'next/server';
import {
  createTask,
  listTasks
} from '@/services/task.service';
import { CreateTaskRequest, TaskListParams, TaskStatus, TaskPriority } from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

const getTasksHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: TaskListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      status: searchParams.get('status') as TaskStatus || undefined,
      priority: searchParams.get('priority') as TaskPriority || undefined,
      assigned_employee_id: searchParams.get('assigned_employee_id') || undefined,
            dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      due_date_from: searchParams.get('due_date_from') ? new Date(searchParams.get('due_date_from')!) : undefined,
      due_date_to: searchParams.get('due_date_to') ? new Date(searchParams.get('due_date_to')!) : undefined,
      sortBy: searchParams.get('sortBy') as TaskListParams['sortBy'] || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      search: searchParams.get('search') || undefined,
    };

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
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.assigned_employee_id) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Title and assigned employee ID are required'
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

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

export const GET = withSecurity(getTasksHandler);
export const POST = withSecurity(createTaskHandler);