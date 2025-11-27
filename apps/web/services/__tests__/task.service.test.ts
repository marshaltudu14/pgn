/**
 * Unit tests for Task Service using Jest
 */

import {
  CreateTaskRequest,
  EmployeeTaskUpdateRequest,
  TaskListParams,
  TaskPriority,
  TaskStatus,
  UpdateTaskRequest,
} from '@pgn/shared';
import {
  createTask,
  getTaskById,
  getTaskStatistics,
  getTasksByEmployee,
  listTasks,
  updateTask,
  updateTaskByEmployee,
} from '../task.service';

// Create a comprehensive Supabase mock
const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(),
  };

  // Setup chainable methods
  const createQueryChain = () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  });

  mockClient.from.mockReturnValue(createQueryChain());

  return mockClient;
};

// Mock the createClient function
jest.mock('../../utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '../../utils/supabase/server';

// Mock data
const mockEmployee = {
  id: 'employee-123',
  first_name: 'John',
  last_name: 'Doe',
  human_readable_user_id: 'PGN-2024-0001',
};

const mockTaskRow = {
  id: 'task-123',
  title: 'Test Task',
  description: 'Test Description',
  assigned_employee_id: 'employee-123',
  status: 'PENDING' as TaskStatus,
  priority: 'MEDIUM' as TaskPriority,
  progress: 0,
  due_date: new Date('2024-12-31').toISOString(),
  completed_at: null,
  completion_notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  assigned_employee: mockEmployee,
};

describe('Task Service', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    (
      createClient as jest.MockedFunction<typeof createClient>
    ).mockResolvedValue(
      mockSupabaseClient as unknown as ReturnType<typeof createClient>
    );
  });

  describe('createTask', () => {
    const validCreateRequest: CreateTaskRequest = {
      title: 'New Task',
      description: 'Task Description',
      assigned_employee_id: 'employee-123',
      priority: 'HIGH' as TaskPriority,
      due_date: new Date('2024-12-31'),
    };

    it('should create a new task successfully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTaskRow,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await createTask(validCreateRequest);

      // The result should match the mapped task (without assigned_employee object)
      expect(result).toEqual(
        expect.objectContaining({
          id: 'task-123',
          title: 'Test Task',
          description: 'Test Description',
          assigned_employee_id: 'employee-123',
          status: 'PENDING' as TaskStatus,
          priority: 'MEDIUM' as TaskPriority,
          progress: 0,
          due_date: new Date('2024-12-31').toISOString(),
          completed_at: null,
          completion_notes: null,
          assigned_employee_name: 'John Doe',
          assigned_employee_human_readable_id: 'PGN-2024-0001',
        })
      );
      expect(mockInsert).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Task Description',
        assigned_employee_id: 'employee-123',
        status: 'PENDING',
        priority: 'HIGH',
        progress: 0,
        due_date: new Date('2024-12-31').toISOString(),
        completed_at: null,
        completion_notes: null,
      });
    });

    it('should create a task with default values when optional fields are not provided', async () => {
      const minimalRequest: CreateTaskRequest = {
        title: 'Minimal Task',
        assigned_employee_id: 'employee-123',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTaskRow,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      await createTask(minimalRequest);

      expect(mockInsert).toHaveBeenCalledWith({
        title: 'Minimal Task',
        description: null,
        assigned_employee_id: 'employee-123',
        status: 'PENDING',
        priority: 'MEDIUM',
        progress: 0,
        due_date: null,
        completed_at: null,
        completion_notes: null,
      });
    });

    it('should throw error when database error occurs', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      await expect(createTask(validCreateRequest)).rejects.toThrow(
        'Failed to create task: Database connection failed'
      );
    });

    it('should throw error when no data is returned', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      await expect(createTask(validCreateRequest)).rejects.toThrow(
        'No data returned from task creation'
      );
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await expect(createTask(validCreateRequest)).rejects.toThrow(
        'Database connection lost'
      );
    });
  });

  describe('listTasks', () => {
    const mockTaskRows = [mockTaskRow];

    it('should return paginated tasks with default parameters', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTaskRows,
            error: null,
            count: 25,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const params: TaskListParams = {};
      const result = await listTasks(params);

      // The result should match mapped tasks (without assigned_employee object)
      expect(result).toEqual({
        tasks: [
          expect.objectContaining({
            id: 'task-123',
            title: 'Test Task',
            description: 'Test Description',
            assigned_employee_id: 'employee-123',
            status: 'PENDING' as TaskStatus,
            priority: 'MEDIUM' as TaskPriority,
            progress: 0,
            due_date: new Date('2024-12-31').toISOString(),
            completed_at: null,
            completion_notes: null,
            assigned_employee_name: 'John Doe',
            assigned_employee_human_readable_id: 'PGN-2024-0001',
          }),
        ],
        page: 1,
        limit: 50,
        total: 25,
        totalPages: 1,
        hasMore: false,
      });
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('*'), {
        count: 'exact',
      });
    });

    it('should apply status filter', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTaskRows,
            error: null,
            count: 10,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const params: TaskListParams = { status: 'COMPLETED' as TaskStatus };
      await listTasks(params);

      expect(mockSelect().eq).toHaveBeenCalledWith('status', 'COMPLETED');
    });

    it('should apply priority filter', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTaskRows,
            error: null,
            count: 10,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const params: TaskListParams = { priority: 'HIGH' as TaskPriority };
      await listTasks(params);

      expect(mockSelect().eq).toHaveBeenCalledWith('priority', 'HIGH');
    });

    it('should apply assigned employee filter', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTaskRows,
            error: null,
            count: 10,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const params: TaskListParams = { assigned_employee_id: 'employee-123' };
      await listTasks(params);

      expect(mockSelect().eq).toHaveBeenCalledWith(
        'assigned_employee_id',
        'employee-123'
      );
    });

    it('should apply date range filters', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTaskRows,
            error: null,
            count: 10,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');
      const params: TaskListParams = { dateFrom, dateTo };
      await listTasks(params);

      expect(mockSelect().gte).toHaveBeenCalledWith(
        'created_at',
        dateFrom.toISOString()
      );
      expect(mockSelect().lte).toHaveBeenCalledWith(
        'created_at',
        dateTo.toISOString()
      );
    });

    it('should apply due date range filters', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTaskRows,
            error: null,
            count: 10,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const dueDateFrom = new Date('2024-06-01');
      const dueDateTo = new Date('2024-06-30');
      const params: TaskListParams = {
        due_date_from: dueDateFrom,
        due_date_to: dueDateTo,
      };
      await listTasks(params);

      expect(mockSelect().gte).toHaveBeenCalledWith(
        'due_date',
        dueDateFrom.toISOString()
      );
      expect(mockSelect().lte).toHaveBeenCalledWith(
        'due_date',
        dueDateTo.toISOString()
      );
    });

    it('should apply search filter', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTaskRows,
            error: null,
            count: 10,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const params: TaskListParams = { search: 'important' };
      await listTasks(params);

      expect(mockSelect().or).toHaveBeenCalledWith(
        'title.ilike.%important%,description.ilike.%important%'
      );
    });

    it('should apply custom sorting', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: mockTaskRows,
            error: null,
            count: 10,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const params: TaskListParams = { sortBy: 'due_date', sortOrder: 'asc' };
      await listTasks(params);

      expect(mockSelect().order).toHaveBeenCalledWith('due_date', {
        ascending: true,
      });
    });

    it('should handle pagination', async () => {
      const mockRange = jest.fn().mockResolvedValue({
        data: mockTaskRows,
        error: null,
        count: 100,
      });
      const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: mockOrder,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const params: TaskListParams = { page: 2, limit: 25 };
      const result = await listTasks(params);

      expect(mockRange).toHaveBeenCalledWith(25, 49);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
      expect(result.totalPages).toBe(4);
      expect(result.hasMore).toBe(true);
    });

    it('should handle null data response', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: null,
            error: null,
            count: 0,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await listTasks({});

      expect(result.tasks).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnValue({
          range: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Query timeout' },
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(listTasks({})).rejects.toThrow(
        'Failed to fetch tasks: Query timeout'
      );
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTaskRow,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getTaskById('task-123');

      // The result should match mapped task (without assigned_employee object)
      expect(result).toEqual(
        expect.objectContaining({
          id: 'task-123',
          title: 'Test Task',
          description: 'Test Description',
          assigned_employee_id: 'employee-123',
          status: 'PENDING' as TaskStatus,
          priority: 'MEDIUM' as TaskPriority,
          progress: 0,
          due_date: new Date('2024-12-31').toISOString(),
          completed_at: null,
          completion_notes: null,
          assigned_employee_name: 'John Doe',
          assigned_employee_human_readable_id: 'PGN-2024-0001',
        })
      );
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('*'));
      expect(mockSelect().eq).toHaveBeenCalledWith('id', 'task-123');
    });

    it('should throw error when task not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows returned' },
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getTaskById('non-existent')).rejects.toThrow(
        'Failed to fetch task: No rows returned'
      );
    });

    it('should throw error for database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection timeout' },
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getTaskById('task-123')).rejects.toThrow(
        'Failed to fetch task: Connection timeout'
      );
    });

    it('should handle empty task ID', async () => {
      await expect(getTaskById('')).rejects.toThrow();
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(getTaskById('task-123')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('updateTask', () => {
    const updateData: UpdateTaskRequest = {
      title: 'Updated Task',
      description: 'Updated Description',
      status: 'IN_PROGRESS' as TaskStatus,
      priority: 'HIGH' as TaskPriority,
      progress: 50,
      due_date: new Date('2024-12-25'),
      completion_notes: 'Working on it',
    };

    it('should update task with all provided fields', async () => {
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { ...mockTaskRow, ...updateData },
          error: null,
        }),
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockUpdate = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      await updateTask('task-123', updateData);

      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        progress: 50,
        due_date: new Date('2024-12-25').toISOString(),
        completion_notes: 'Working on it',
      });
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'task-123');
    });

    it('should auto-update completion timestamp when status is COMPLETED', async () => {
      const completedUpdateData: UpdateTaskRequest = {
        status: 'COMPLETED' as TaskStatus,
      };

      const mockUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockTaskRow, ...completedUpdateData },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      await updateTask('task-123', completedUpdateData);

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.status).toBe('COMPLETED');
      expect(updateCall.completed_at).toBeDefined();
    });

    it('should not auto-update completion timestamp when completion_notes are provided', async () => {
      const completedUpdateData: UpdateTaskRequest = {
        status: 'COMPLETED' as TaskStatus,
        completion_notes: 'Task completed successfully',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockTaskRow, ...completedUpdateData },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      await updateTask('task-123', completedUpdateData);

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.status).toBe('COMPLETED');
      expect(updateCall.completion_notes).toBe('Task completed successfully');
      expect(updateCall.completed_at).toBeUndefined();
    });

    it('should throw error when task not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      await expect(updateTask('non-existent', updateData)).rejects.toThrow(
        'Task not found or update failed'
      );
    });

    it('should throw error for database errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      await expect(updateTask('task-123', updateData)).rejects.toThrow(
        'Failed to update task: Database connection failed'
      );
    });

    it('should handle empty task ID', async () => {
      await expect(updateTask('', updateData)).rejects.toThrow();
    });
  });

  describe('updateTaskByEmployee', () => {
    const employeeUpdateData: EmployeeTaskUpdateRequest = {
      status: 'IN_PROGRESS' as TaskStatus,
      progress: 75,
      completion_notes: 'Almost done',
    };

    it('should update task with employee-permitted fields', async () => {
      const mockEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { ...mockTaskRow, ...employeeUpdateData },
          error: null,
        }),
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockUpdate = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      await updateTaskByEmployee('task-123', employeeUpdateData);

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'IN_PROGRESS',
        progress: 75,
        completion_notes: 'Almost done',
      });
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'task-123');
    });

    it('should auto-update completion timestamp when status is COMPLETED', async () => {
      const completedUpdateData: EmployeeTaskUpdateRequest = {
        status: 'COMPLETED' as TaskStatus,
      };

      const mockUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockTaskRow, ...completedUpdateData },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      await updateTaskByEmployee('task-123', completedUpdateData);

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.status).toBe('COMPLETED');
      expect(updateCall.completed_at).toBeDefined();
    });

    it('should throw error when task not found', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        updateTaskByEmployee('non-existent', employeeUpdateData)
      ).rejects.toThrow('Task not found or update failed');
    });

    it('should throw error for database errors', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        updateTaskByEmployee('task-123', employeeUpdateData)
      ).rejects.toThrow('Failed to update task: Database connection failed');
    });

    it('should handle empty task ID', async () => {
      await expect(
        updateTaskByEmployee('', employeeUpdateData)
      ).rejects.toThrow();
    });
  });

  describe('getTaskStatistics', () => {
    const mockTasksData = [
      {
        ...mockTaskRow,
        status: 'PENDING' as TaskStatus,
        priority: 'HIGH' as TaskPriority,
        progress: 0,
        due_date: new Date('2024-12-31').toISOString(),
      },
      {
        ...mockTaskRow,
        id: 'task-2',
        status: 'IN_PROGRESS' as TaskStatus,
        priority: 'MEDIUM' as TaskPriority,
        progress: 50,
        due_date: new Date('2024-11-15').toISOString(), // Overdue
      },
      {
        ...mockTaskRow,
        id: 'task-3',
        status: 'COMPLETED' as TaskStatus,
        priority: 'LOW' as TaskPriority,
        progress: 100,
        due_date: new Date('2024-12-31').toISOString(),
      },
      {
        ...mockTaskRow,
        id: 'task-4',
        status: 'CANCELLED' as TaskStatus,
        priority: 'URGENT' as TaskPriority,
        progress: 25,
        due_date: new Date('2024-11-15').toISOString(), // Overdue but cancelled
      },
      {
        ...mockTaskRow,
        id: 'task-5',
        status: 'ON_HOLD' as TaskStatus,
        priority: 'MEDIUM' as TaskPriority,
        progress: 30,
        due_date: null,
      },
    ];

    it('should return task statistics for all tasks', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: mockTasksData,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getTaskStatistics();

      expect(result).toEqual({
        totalTasks: 5,
        pendingTasks: 1,
        inProgressTasks: 1,
        completedTasks: 1,
        cancelledTasks: 1,
        onHoldTasks: 1,
        averageProgress: (0 + 50 + 100 + 25 + 30) / 5,
        overdueTasks: 2, // Both IN_PROGRESS and CANCELLED tasks with past due dates are counted
        tasksByPriority: {
          low: 1,
          medium: 2,
          high: 1,
          urgent: 1,
        },
      });
    });

    it('should return task statistics filtered by employee', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [mockTasksData[0], mockTasksData[2]], // Only 2 tasks for employee
          error: null,
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getTaskStatistics({
        assignedEmployeeId: 'employee-123',
      });

      expect(result.totalTasks).toBe(2);
      expect(mockSelect().eq).toHaveBeenCalledWith(
        'assigned_employee_id',
        'employee-123'
      );
    });

    it('should handle empty task list', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getTaskStatistics();

      expect(result).toEqual({
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        cancelledTasks: 0,
        onHoldTasks: 0,
        averageProgress: 0,
        overdueTasks: 0,
        tasksByPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        },
      });
    });

    it('should handle null data response', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getTaskStatistics();

      expect(result.totalTasks).toBe(0);
    });

    it('should throw error for database errors', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getTaskStatistics()).rejects.toThrow(
        'Failed to fetch task statistics: Database connection failed'
      );
    });
  });

  describe('getTasksByEmployee', () => {
    const mockEmployeeTasks = [mockTaskRow];

    it('should return tasks assigned to specific employee', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockEmployeeTasks,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getTasksByEmployee('employee-123');

      // The result should match mapped task (without assigned_employee object)
      expect(result).toEqual([
        expect.objectContaining({
          id: 'task-123',
          title: 'Test Task',
          description: 'Test Description',
          assigned_employee_id: 'employee-123',
          status: 'PENDING' as TaskStatus,
          priority: 'MEDIUM' as TaskPriority,
          progress: 0,
          due_date: new Date('2024-12-31').toISOString(),
          completed_at: null,
          completion_notes: null,
          assigned_employee_name: 'John Doe',
          assigned_employee_human_readable_id: 'PGN-2024-0001',
        }),
      ]);
      expect(mockSelect().eq).toHaveBeenCalledWith(
        'assigned_employee_id',
        'employee-123'
      );
      expect(mockSelect().eq().order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });

    it('should return empty array when no tasks found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getTasksByEmployee('employee-456');

      expect(result).toEqual([]);
    });

    it('should handle null data response', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getTasksByEmployee('employee-123');

      expect(result).toEqual([]);
    });

    it('should throw error for database errors', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getTasksByEmployee('employee-123')).rejects.toThrow(
        'Failed to fetch employee tasks: Database connection failed'
      );
    });

    it('should handle empty employee ID', async () => {
      // Empty string should not throw an error but return empty array
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getTasksByEmployee('');
      expect(result).toEqual([]);
    });

    it('should handle database exceptions', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await expect(getTasksByEmployee('employee-123')).rejects.toThrow(
        'Database connection lost'
      );
    });
  });
});
