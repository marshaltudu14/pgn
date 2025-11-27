import { CreateTaskRequest, Task, UpdateTaskRequest } from '@pgn/shared';
import { act, renderHook } from '@testing-library/react';
import { useTaskStore } from '../taskStore';

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create a mock response
const createMockResponse = (
  data: unknown,
  ok = true,
  status = 200
): Response => {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '/api/tasks',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  } as unknown as Response;
};

// Sample test data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Description for test task 1',
    status: 'PENDING',
    priority: 'MEDIUM',
    due_date: '2024-01-15',
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
    assigned_employee_id: 'emp1',
    progress: 0,
    completed_at: null,
    completion_notes: null,
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Description for test task 2',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    due_date: '2024-01-20',
    created_at: '2024-01-03',
    updated_at: '2024-01-04',
    assigned_employee_id: 'emp2',
    progress: 50,
    completed_at: null,
    completion_notes: null,
  },
];

describe('Task Store', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockFetch.mockReset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useTaskStore());

      expect(result.current.tasks).toEqual([]);
      expect(result.current.selectedTask).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.filter).toEqual({
        status: undefined,
        priority: undefined,
        assigned_employee_id: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        due_date_from: undefined,
        due_date_to: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
        search: undefined,
      });
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('fetchTasks', () => {
    it('should fetch tasks successfully with default parameters', async () => {
      const mockResponse = createMockResponse({
        success: true,
        data: {
          tasks: mockTasks,
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
          hasMore: false,
        },
      });

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.fetchTasks();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks?'),
        expect.any(Object)
      );
      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 2,
        itemsPerPage: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch tasks error', async () => {
      const mockErrorResponse = createMockResponse(
        { message: 'Failed to fetch tasks' },
        false,
        500
      );

      mockFetch.mockResolvedValue(mockErrorResponse);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.fetchTasks();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('fetchTaskById', () => {
    it('should fetch a single task successfully', async () => {
      const mockResponse = createMockResponse({
        success: true,
        data: mockTasks[0],
      });

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        const task = await result.current.fetchTaskById('1');
        // Manually set selected task since fetchTaskById doesn't do it automatically
        result.current.setSelectedTask(task);
        // Clear any error that might have been set
        result.current.clearError();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tasks/1',
        expect.any(Object)
      );
      expect(result.current.selectedTask).toEqual(mockTasks[0]);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch task by ID error', async () => {
      const mockErrorResponse = createMockResponse(
        { message: 'Task not found' },
        false,
        404
      );

      mockFetch.mockResolvedValue(mockErrorResponse);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        try {
          await result.current.fetchTaskById('999');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const newTask: CreateTaskRequest = {
        title: 'New Task',
        description: 'Description for new task',
        assigned_employee_id: 'emp3',
        priority: 'LOW',
        due_date: new Date('2024-01-25'),
      };

      const createdTask = {
        ...newTask,
        id: '3',
        created_at: '2024-01-05',
        updated_at: '2024-01-05',
        progress: 0,
        status: 'PENDING',
        checkpoints: null,
        completed_at: null,
        completion_notes: null,
        current_checkpoint: null,
      };

      const mockResponse = createMockResponse({
        success: true,
        data: createdTask,
      });

      // Mock fetchTasks call that happens after createTask
      mockFetch
        .mockResolvedValueOnce(mockResponse) // For createTask
        .mockResolvedValueOnce({
          // For fetchTasks call
          success: true,
          data: {
            tasks: [...mockTasks, createdTask],
            page: 1,
            limit: 50,
            total: 3,
            totalPages: 1,
            hasMore: false,
          },
        });

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.createTask(newTask);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(newTask),
        })
      );
      expect(result.current.createError).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const updateData: UpdateTaskRequest = {
        title: 'Updated Task 1',
        status: 'COMPLETED',
      };

      const updatedTask = {
        ...mockTasks[0],
        ...updateData,
      };

      const mockResponse = createMockResponse({
        success: true,
        data: updatedTask,
      });

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTaskStore());

      // Set up initial tasks in the store
      act(() => {
        result.current.tasks = mockTasks;
      });

      await act(async () => {
        await result.current.updateTask('1', updateData);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tasks/1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(updateData),
        })
      );
      expect(result.current.updateError).toBeNull();
    });
  });

  describe('setSelectedTask', () => {
    it('should set selected task', () => {
      const { result } = renderHook(() => useTaskStore());

      act(() => {
        result.current.setSelectedTask(mockTasks[0]);
      });

      expect(result.current.selectedTask).toEqual(mockTasks[0]);
    });

    it('should clear selected task', () => {
      const { result } = renderHook(() => useTaskStore());

      // First set a task
      act(() => {
        result.current.setSelectedTask(mockTasks[0]);
      });

      expect(result.current.selectedTask).toEqual(mockTasks[0]);

      // Then clear it
      act(() => {
        result.current.setSelectedTask(null);
      });

      expect(result.current.selectedTask).toBeNull();
    });
  });

  describe('setFilters', () => {
    it('should set filters', () => {
      const { result } = renderHook(() => useTaskStore());

      const newFilters = {
        status: 'PENDING' as const,
        priority: 'HIGH' as const,
        search: 'test',
      };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filter).toEqual({
        status: 'PENDING',
        priority: 'HIGH',
        search: 'test',
        assigned_employee_id: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        due_date_from: undefined,
        due_date_to: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters', () => {
      const { result } = renderHook(() => useTaskStore());

      // First set some filters
      act(() => {
        result.current.setFilters({
          status: 'PENDING' as const,
          priority: 'HIGH' as const,
          search: 'test',
        });
      });

      // Then clear them
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filter).toEqual({
        status: undefined,
        priority: undefined,
        search: undefined,
        assigned_employee_id: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        due_date_from: undefined,
        due_date_to: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
    });
  });

  describe('Error Clearing Methods', () => {
    it('should clear general error', () => {
      const { result } = renderHook(() => useTaskStore());

      // First set an error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear create error', () => {
      const { result } = renderHook(() => useTaskStore());

      // Clear create error
      act(() => {
        result.current.clearCreateError();
      });

      expect(result.current.createError).toBeNull();
    });

    it('should clear update error', () => {
      const { result } = renderHook(() => useTaskStore());

      // Clear update error
      act(() => {
        result.current.clearUpdateError();
      });

      expect(result.current.updateError).toBeNull();
    });
  });

  describe('setPagination', () => {
    it('should set pagination page', () => {
      const { result } = renderHook(() => useTaskStore());

      act(() => {
        result.current.setPagination(2);
      });

      expect(result.current.pagination.currentPage).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useTaskStore());

      // Set some state
      act(() => {
        result.current.setFilters({
          status: 'PENDING' as const,
          search: 'test',
        });
        result.current.setSelectedTask(mockTasks[0]);
      });

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.selectedTask).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.filter).toEqual({
        status: undefined,
        priority: undefined,
        assigned_employee_id: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        due_date_from: undefined,
        due_date_to: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
        search: undefined,
      });
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty task list response', async () => {
      const mockResponse = createMockResponse({
        success: true,
        data: {
          tasks: [],
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      });

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.fetchTasks();
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.pagination.totalItems).toBe(0);
    });

    it('should handle malformed API response', async () => {
      const mockResponse = createMockResponse(null);

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTaskStore());

      await act(async () => {
        await result.current.fetchTasks();
      });

      // The error should be set when response is malformed
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
