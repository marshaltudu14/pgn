'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTaskStore } from '@/app/lib/stores/taskStore';
import { Task, UpdateTaskRequest, CreateTaskRequest, TaskListParams } from '@pgn/shared';
import { TaskFilters } from '@/app/lib/stores/taskStore';
import { TaskTable, TaskDetailsModal, TaskCreateModal } from '@/components/tasks';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function TaskManagementClient() {
  const {
    tasks,
    isLoading,
    pagination,
    updateError,
    fetchTasks,
    updateTask,
    setPagination,
    setFilters,
    clearFilters,
    clearUpdateError,
  } = useTaskStore();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Use refs to track current values to prevent infinite loops
  const prevPaginationRef = useRef(pagination);
  const prevFilterRef = useRef(useTaskStore.getState().filter);

  // Load initial data only once
  useEffect(() => {
    const store = useTaskStore.getState();
    store.fetchTasks();
  }, []); // Empty dependency array to run only once

  
  // Handle pagination changes
  useEffect(() => {
    const store = useTaskStore.getState();
    const currentPagination = store.pagination;
    const currentFilter = store.filter;

    // Only fetch if filter or pagination actually changed
    if (
      JSON.stringify(currentPagination) !== JSON.stringify(prevPaginationRef.current) ||
      JSON.stringify(currentFilter) !== JSON.stringify(prevFilterRef.current)
    ) {
      const params = {
        ...currentFilter,
        // Convert string dates to Date objects for TaskListParams
        dateFrom: currentFilter.dateFrom ? new Date(currentFilter.dateFrom) : undefined,
        dateTo: currentFilter.dateTo ? new Date(currentFilter.dateTo) : undefined,
        due_date_from: currentFilter.due_date_from ? new Date(currentFilter.due_date_from) : undefined,
        due_date_to: currentFilter.due_date_to ? new Date(currentFilter.due_date_to) : undefined,
      };
      store.fetchTasks(params);
      prevPaginationRef.current = { ...currentPagination };
      prevFilterRef.current = { ...currentFilter };
    }
  }, [pagination]); // Monitor changes but prevent infinite loops

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setPagination(page);
  }, [setPagination]);

  // Handle task record selection
  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  }, []);

  // Handle task update
  const handleTaskUpdate = async (taskId: string, updateData: UpdateTaskRequest) => {
    try {
      await updateTask(taskId, updateData);
      if (showDetailsModal) {
        setShowDetailsModal(false);
        setSelectedTask(null);
      }
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  // Handle task creation
  const handleTaskCreate = async (_taskData: CreateTaskRequest) => {
    try {
      await fetchTasks(); // Refresh the list
      setShowCreateModal(false);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  // Handle modal close with error clearing
  const handleDetailsModalClose = useCallback((open: boolean) => {
    if (!open) {
      clearUpdateError();
      setSelectedTask(null);
    }
    setShowDetailsModal(open);
  }, [clearUpdateError]);

  // Handle filter changes
  const handleFilterChange = useCallback((filters: Partial<TaskListParams>) => {
    // Convert Date objects to ISO strings for TaskFilters
    const convertedFilters: Partial<TaskFilters> = {
      ...filters,
      dateFrom: filters.dateFrom instanceof Date ? filters.dateFrom.toISOString() : filters.dateFrom,
      dateTo: filters.dateTo instanceof Date ? filters.dateTo.toISOString() : filters.dateTo,
      due_date_from: filters.due_date_from instanceof Date ? filters.due_date_from.toISOString() : filters.due_date_from,
      due_date_to: filters.due_date_to instanceof Date ? filters.due_date_to.toISOString() : filters.due_date_to,
    };
    setFilters(convertedFilters);
  }, [setFilters]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  // Check if user is admin - all authenticated web users are admins
  const isAdmin = true; // Web authentication ensures admin role

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tasks</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">
              {pagination.totalItems} task{pagination.totalItems !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>

      {/* Error Display */}
      {updateError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex justify-between items-center">
          <p className="text-red-800 dark:text-red-200">{updateError}</p>
          <Button variant="outline" size="sm" onClick={clearUpdateError}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Task Table */}
      <TaskTable
        tasks={tasks}
        isLoading={isLoading}
        onTaskSelect={handleTaskSelect}
        onPageChange={handlePageChange}
        pagination={pagination}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        isAdmin={isAdmin}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        open={showDetailsModal}
        onOpenChange={handleDetailsModalClose}
        task={selectedTask}
        onUpdate={handleTaskUpdate}
        isUpdating={isLoading}
        updateError={updateError}
        isAdmin={isAdmin}
      />

      {/* Create Task Modal */}
      <TaskCreateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTaskCreated={handleTaskCreate}
        isCreating={isLoading}
      />
      </div>
    </div>
  );
}