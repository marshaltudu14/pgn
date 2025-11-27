import { create } from 'zustand';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  EmployeeTaskUpdateRequest,
  TaskListParams,
  TaskListResponse,
  TaskStatus,
  TaskPriority,
} from '@pgn/shared';

/**
 * Transform technical error messages into user-friendly ones
 */
function getUserFriendlyErrorMessage(error: string): string {
  // Clean up the error message first
  const cleanError = error
    .replace(/AuthApiError:\s*/, '')
    .replace(/DatabaseError:\s*/, '')
    .trim();

  // Handle common errors
  if (
    cleanError.includes('You do not have permission to view tasks') ||
    error.includes('You do not have permission to view tasks')
  ) {
    return 'You do not have permission to view tasks. Please contact your administrator.';
  }

  if (cleanError.includes('Task not found')) {
    return 'Task not found in the system.';
  }

  if (cleanError.includes('new row violates row-level security policy')) {
    return 'You do not have permission to access this task. Please contact your administrator.';
  }

  if (cleanError.includes('duplicate key')) {
    return 'A task with this identifier already exists.';
  }

  if (cleanError.includes('Only admins can create tasks')) {
    return 'Only administrators can create tasks.';
  }

  if (cleanError.includes('Access denied - you can only view')) {
    return 'You can only view your assigned tasks.';
  }

  if (cleanError.includes('Access denied - you can only update')) {
    return 'You can only update your assigned tasks.';
  }

  if (cleanError.includes('Network connection failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (cleanError.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Generic fallback
  return 'An error occurred. Please try again or contact support if the problem persists.';
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_employee_id?: string;
  dateFrom?: string;
  dateTo?: string;
  due_date_from?: string;
  due_date_to?: string;
  sortBy?: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'progress';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
  createError: string | null;
  updateError: string | null;
  filter: TaskFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  fetchTasks: (params?: Partial<TaskListParams>, paginationOverride?: TaskFilters | undefined) => Promise<void>;
  fetchTaskById: (taskId: string) => Promise<Task>;
  createTask: (taskData: CreateTaskRequest) => Promise<Task>;
  updateTask: (
    taskId: string,
    updateData: UpdateTaskRequest | EmployeeTaskUpdateRequest
  ) => Promise<Task>;
  setSelectedTask: (task: Task | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  clearError: () => void;
  clearCreateError: () => void;
  clearUpdateError: () => void;
  setPagination: (page: number) => void;
  reset: () => void;
}

const initialState = {
  tasks: [],
  selectedTask: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  createError: null,
  updateError: null,
  filter: {
    status: undefined,
    priority: undefined,
    assigned_employee_id: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    due_date_from: undefined,
    due_date_to: undefined,
    sortBy: 'created_at' as const,
    sortOrder: 'desc' as const,
    search: undefined,
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

export { initialState };
export const useTaskStore = create<TaskState>((set, get) => ({
  ...initialState,

  fetchTasks: async (params?: Partial<TaskListParams>) => {
    set({ isLoading: true, error: null });

    try {
      const { filter, pagination } = get();

      // Build query parameters
      const queryParams: TaskListParams = {
        page: params?.page || pagination.currentPage,
        limit: params?.limit || pagination.itemsPerPage,
        status: params?.status || filter.status,
        priority: params?.priority || filter.priority,
        assigned_employee_id:
          params?.assigned_employee_id || filter.assigned_employee_id,
        dateFrom: params?.dateFrom
          ? new Date(params.dateFrom)
          : filter.dateFrom
            ? new Date(filter.dateFrom)
            : undefined,
        dateTo: params?.dateTo
          ? new Date(params.dateTo)
          : filter.dateTo
            ? new Date(filter.dateTo)
            : undefined,
        due_date_from: params?.due_date_from
          ? new Date(params.due_date_from)
          : filter.due_date_from
            ? new Date(filter.due_date_from)
            : undefined,
        due_date_to: params?.due_date_to
          ? new Date(params.due_date_to)
          : filter.due_date_to
            ? new Date(filter.due_date_to)
            : undefined,
        sortBy: params?.sortBy || filter.sortBy || 'created_at',
        sortOrder: params?.sortOrder || filter.sortOrder || 'desc',
        search: params?.search || filter.search,
      };

      const queryString = new URLSearchParams();

      // Add all non-undefined parameters to query string
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            queryString.append(key, value.toISOString());
          } else {
            queryString.append(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/tasks?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch tasks');
      }

      const result: TaskListResponse = data.data;

      set({
        tasks: result.tasks,
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalItems: result.total,
          itemsPerPage: result.limit,
          hasNextPage: result.hasMore,
          hasPreviousPage: result.page > 1,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      const errorMessage = getUserFriendlyErrorMessage(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  fetchTaskById: async (taskId: string): Promise<Task> => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch task');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      const errorMessage = getUserFriendlyErrorMessage(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      set({ error: errorMessage });
      throw error;
    }
  },

  createTask: async (taskData: CreateTaskRequest): Promise<Task> => {
    set({ isCreating: true, createError: null });

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to create task');
      }

      const newTask: Task = data.data;

      // Refresh the tasks list to include the new task
      const { fetchTasks } = get();
      await fetchTasks();

      set({
        isCreating: false,
      });

      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = getUserFriendlyErrorMessage(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      set({
        createError: errorMessage,
        isCreating: false,
      });
      throw error;
    }
  },

  updateTask: async (
    taskId: string,
    updateData: UpdateTaskRequest | EmployeeTaskUpdateRequest
  ): Promise<Task> => {
    set({ isUpdating: true, updateError: null });

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to update task');
      }

      const updatedTask: Task = data.data;

      // Update the task in the local state
      const { tasks } = get();
      const updatedTasks = tasks.map(task =>
        task.id === taskId ? updatedTask : task
      );

      // Update selected task if it's the one being updated
      const { selectedTask } = get();
      if (selectedTask?.id === taskId) {
        set({ selectedTask: updatedTask });
      }

      set({
        tasks: updatedTasks,
        isUpdating: false,
      });

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = getUserFriendlyErrorMessage(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      set({
        updateError: errorMessage,
        isUpdating: false,
      });
      throw error;
    }
  },

  setSelectedTask: (task: Task | null) => {
    set({ selectedTask: task });
  },

  setFilters: (filters: Partial<TaskFilters>) => {
    const currentFilter = get().filter;
    set({
      filter: { ...currentFilter, ...filters },
      // Reset to first page when filters change
      pagination: {
        ...get().pagination,
        currentPage: 1,
      },
    });
  },

  clearFilters: () => {
    set({
      filter: {
        status: undefined,
        priority: undefined,
        assigned_employee_id: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        due_date_from: undefined,
        due_date_to: undefined,
        sortBy: 'created_at' as const,
        sortOrder: 'desc',
        search: undefined,
      },
      pagination: {
        ...get().pagination,
        currentPage: 1,
      },
    });
  },

  clearError: () => {
    set({ error: null });
  },

  clearCreateError: () => {
    set({ createError: null });
  },

  clearUpdateError: () => {
    set({ updateError: null });
  },

  setPagination: (page: number) => {
    set({
      pagination: {
        ...get().pagination,
        currentPage: page,
      },
    });
  },

  reset: () => {
    set(initialState);
  },
}));
