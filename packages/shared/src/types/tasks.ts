// Task management types for PGN system

import { Database } from './supabase';

// Extract the tasks table type from the database
export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// Task status and priority types
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Extended Task interface with display fields
export interface Task extends TaskRow {
  assigned_employee_name?: string; // For display purposes
  assigned_employee_human_readable_id?: string; // PGN-YYYY-NNNN format
}


export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigned_employee_id: string;
  priority?: TaskPriority;
  due_date?: Date;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  progress?: number;
  due_date?: Date;
  completion_notes?: string;
}

export interface EmployeeTaskUpdateRequest {
  status?: TaskStatus;
  progress?: number;
  completion_notes?: string;
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_employee_id?: string;
  dateFrom?: Date;
  dateTo?: Date;
  due_date_from?: Date;
  due_date_to?: Date;
  sortBy?: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'progress';
  sortOrder?: 'asc' | 'desc';
  search?: string; // Search in title and description
}

export interface TaskListResponse {
  tasks: Task[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface TaskStatistics {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  onHoldTasks: number;
  averageProgress: number;
  overdueTasks: number;
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

export interface TaskValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Form types for task creation and editing
export interface TaskFormData {
  title: string;
  description?: string;
  assignedEmployeeId: string;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD format for form inputs
}

// Mobile app specific task types
export interface MobileTaskView extends Omit<Task, 'assignedEmployeeName' | 'assignedByName'> {
  canUpdate: boolean; // Employee can only update their assigned tasks
}

export interface TaskUpdateRequest {
  taskId: string;
  status?: TaskStatus;
  progress?: number;
  completionNotes?: string;
}

// Task notification types
export interface TaskNotification {
  id: string;
  taskId: string;
  taskTitle: string;
  type: 'ASSIGNED' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';
  message: string;
  employeeId: string;
  isRead: boolean;
  createdAt: Date;
}

export interface TaskActivityLog {
  id: string;
  taskId: string;
  employeeId: string;
  action: 'CREATED' | 'UPDATED' | 'COMPLETED' | 'CANCELLED';
  details: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: Date;
}