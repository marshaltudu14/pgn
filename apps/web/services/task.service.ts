/**
 * Task Service
 * Handles CRUD operations for tasks with Supabase integration
 */

import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  EmployeeTaskUpdateRequest,
  TaskListParams,
  TaskListResponse,
  TaskStatistics,
} from '@pgn/shared';
import {
  Database,
  TablesInsert,
  TablesUpdate,
} from '@pgn/shared';

type TaskInsert = TablesInsert<'tasks'>;
type TaskUpdate = TablesUpdate<'tasks'>;

import { createClient } from '../utils/supabase/server';

/**
 * Create a new task
 */
export async function createTask(createData: CreateTaskRequest): Promise<Task> {
  const supabase = await createClient();

  // Prepare task data
  const taskData: TaskInsert = {
    title: createData.title,
    description: createData.description || null,
    assigned_employee_id: createData.assigned_employee_id,
    status: 'PENDING',
    priority: createData.priority || 'MEDIUM',
    progress: 0,
    due_date: createData.due_date?.toISOString() || null,
    completed_at: null,
    completion_notes: null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select(`
      *,
      assigned_employee:employees!tasks_assigned_employee_id_fkey (
        id,
        first_name,
        last_name,
        human_readable_user_id
      )
    `)
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw new Error(`Failed to create task: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from task creation');
  }

  // Transform data to match Task interface
  return mapTaskRowToTask(data);
}

/**
 * Get tasks with filtering and pagination
 */
export async function listTasks(params: TaskListParams): Promise<TaskListResponse> {
  const supabase = await createClient();

  let query = supabase
    .from('tasks')
    .select(`
      *,
      assigned_employee:employees!tasks_assigned_employee_id_fkey (
        id,
        first_name,
        last_name,
        human_readable_user_id
      )
    `, { count: 'exact' });

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.priority) {
    query = query.eq('priority', params.priority);
  }

  if (params.assigned_employee_id) {
    query = query.eq('assigned_employee_id', params.assigned_employee_id);
  }

  if (params.dateFrom) {
    query = query.gte('created_at', params.dateFrom.toISOString());
  }

  if (params.dateTo) {
    query = query.lte('created_at', params.dateTo.toISOString());
  }

  if (params.due_date_from) {
    query = query.gte('due_date', params.due_date_from.toISOString());
  }

  if (params.due_date_to) {
    query = query.lte('due_date', params.due_date_to.toISOString());
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  // Apply sorting
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  const tasks: Task[] = (data || []).map(mapTaskRowToTask);
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    tasks,
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Get a single task by ID
 */
export async function getTaskById(taskId: string): Promise<Task> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_employee:employees!tasks_assigned_employee_id_fkey (
        id,
        first_name,
        last_name,
        human_readable_user_id
      )
    `)
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('Error fetching task:', error);
    throw new Error(`Failed to fetch task: ${error.message}`);
  }

  if (!data) {
    throw new Error('Task not found');
  }

  return mapTaskRowToTask(data);
}

/**
 * Update a task (admin can update all fields)
 */
export async function updateTask(taskId: string, updateData: UpdateTaskRequest): Promise<Task> {
  const supabase = await createClient();

  const taskUpdate: TaskUpdate = {};

  if (updateData.title !== undefined) taskUpdate.title = updateData.title;
  if (updateData.description !== undefined) taskUpdate.description = updateData.description;
  if (updateData.status !== undefined) taskUpdate.status = updateData.status;
  if (updateData.priority !== undefined) taskUpdate.priority = updateData.priority;
  if (updateData.progress !== undefined) taskUpdate.progress = updateData.progress;
  if (updateData.due_date !== undefined) taskUpdate.due_date = updateData.due_date.toISOString();
  if (updateData.completion_notes !== undefined) taskUpdate.completion_notes = updateData.completion_notes;

  // Auto-update completion timestamp
  if (updateData.status === 'COMPLETED' && !updateData.completion_notes) {
    taskUpdate.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(taskUpdate)
    .select(`
      *,
      assigned_employee:employees!tasks_assigned_employee_id_fkey (
        id,
        first_name,
        last_name,
        human_readable_user_id
      )
    `)
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw new Error(`Failed to update task: ${error.message}`);
  }

  if (!data) {
    throw new Error('Task not found or update failed');
  }

  return mapTaskRowToTask(data);
}

/**
 * Update a task (employee can only update specific fields)
 */
export async function updateTaskByEmployee(
  taskId: string,
  updateData: EmployeeTaskUpdateRequest
): Promise<Task> {
  const supabase = await createClient();

  const taskUpdate: TaskUpdate = {};

  if (updateData.status !== undefined) taskUpdate.status = updateData.status;
  if (updateData.progress !== undefined) taskUpdate.progress = updateData.progress;
  if (updateData.completion_notes !== undefined) taskUpdate.completion_notes = updateData.completion_notes;

  // Auto-update completion timestamp
  if (updateData.status === 'COMPLETED' && !updateData.completion_notes) {
    taskUpdate.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(taskUpdate)
    .select(`
      *,
      assigned_employee:employees!tasks_assigned_employee_id_fkey (
        id,
        first_name,
        last_name,
        human_readable_user_id
      )
    `)
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw new Error(`Failed to update task: ${error.message}`);
  }

  if (!data) {
    throw new Error('Task not found or update failed');
  }

  return mapTaskRowToTask(data);
}

/**
 * Get task statistics
 */
export async function getTaskStatistics(filters?: {
  assignedEmployeeId?: string;
}): Promise<TaskStatistics> {
  const supabase = await createClient();

  let query = supabase.from('tasks').select('*');

  if (filters?.assignedEmployeeId) {
    query = query.eq('assigned_employee_id', filters.assignedEmployeeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching task statistics:', error);
    throw new Error(`Failed to fetch task statistics: ${error.message}`);
  }

  const tasks = data || [];
  const now = new Date();

  const stats: TaskStatistics = {
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
    inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    cancelledTasks: tasks.filter(t => t.status === 'CANCELLED').length,
    onHoldTasks: tasks.filter(t => t.status === 'ON_HOLD').length,
    averageProgress: tasks.length > 0
      ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
      : 0,
    overdueTasks: tasks.filter(t =>
      t.due_date &&
      new Date(t.due_date) < now &&
      t.status !== 'COMPLETED' &&
      t.status !== 'CANCELLED'
    ).length,
    tasksByPriority: {
      low: tasks.filter(t => t.priority === 'LOW').length,
      medium: tasks.filter(t => t.priority === 'MEDIUM').length,
      high: tasks.filter(t => t.priority === 'HIGH').length,
      urgent: tasks.filter(t => t.priority === 'URGENT').length,
    },
  };

  return stats;
}

/**
 * Get tasks assigned to a specific employee
 */
export async function getTasksByEmployee(employeeId: string): Promise<Task[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_employee:employees!tasks_assigned_employee_id_fkey (
        id,
        first_name,
        last_name,
        human_readable_user_id
      )
    `)
    .eq('assigned_employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching employee tasks:', error);
    throw new Error(`Failed to fetch employee tasks: ${error.message}`);
  }

  return (data || []).map(mapTaskRowToTask);
}

/**
 * Helper function to map database row to Task interface
 */
function mapTaskRowToTask(row: Database['public']['Tables']['tasks']['Row'] & {
  assigned_employee?: Database['public']['Tables']['employees']['Row'] | null;
}): Task {
  return {
    ...row,
    assigned_employee_name: row.assigned_employee
      ? `${row.assigned_employee.first_name} ${row.assigned_employee.last_name}`
      : undefined,
    assigned_employee_human_readable_id: row.assigned_employee?.human_readable_user_id,
  };
}