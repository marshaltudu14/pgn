/**
 * Task Table Component
 * Displays task records with responsive design and pagination
 */

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Task, TaskStatus, TaskPriority, TaskListParams } from '@pgn/shared';
import { Eye, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';

// Status configuration
const TASK_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    dotColor: 'bg-yellow-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    dotColor: 'bg-blue-500',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    dotColor: 'bg-green-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    dotColor: 'bg-red-500',
  },
  ON_HOLD: {
    label: 'On Hold',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    dotColor: 'bg-gray-500',
  },
};

// Priority configuration
const TASK_PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  HIGH: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
};

// Status Badge Component
const StatusBadge = ({ status }: { status?: string | TaskStatus }) => {
  const config = status && status in TASK_STATUS_CONFIG
    ? TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG]
    : TASK_STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority?: string | TaskPriority }) => {
  const config = priority && priority in TASK_PRIORITY_CONFIG
    ? TASK_PRIORITY_CONFIG[priority as keyof typeof TASK_PRIORITY_CONFIG]
    : TASK_PRIORITY_CONFIG.MEDIUM;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

interface TaskTableProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskSelect: (task: Task) => void;
  onPageChange: (page: number) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  onFilterChange: (filters: Partial<TaskListParams>) => void;
  onClearFilters: () => void;
  isAdmin: boolean;
}

export function TaskTable({
  tasks,
  isLoading,
  onTaskSelect,
  onPageChange,
  pagination,
  onFilterChange,
  onClearFilters,
  isAdmin,
}: TaskTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    // Apply filters immediately to clear search and fetch data
    const filters: Partial<TaskListParams> = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (priorityFilter !== 'all') filters.priority = priorityFilter;
    onFilterChange(filters);
  }, [statusFilter, priorityFilter, onFilterChange]);
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters when they change
  const applyFilters = useCallback(() => {
    const filters: Partial<TaskListParams> = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (priorityFilter !== 'all') filters.priority = priorityFilter;

    onFilterChange(filters);
  }, [searchTerm, statusFilter, priorityFilter, onFilterChange]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  
  return (
    <>
      {/* Filters */}
      <div className="bg-white dark:bg-black">
        <div className="px-2 py-3 lg:p-6 border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 cursor-pointer"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {(statusFilter || priorityFilter) && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {[statusFilter, priorityFilter].filter(Boolean).length}
                  </span>
                )}
              </Button>

              {/* Clear Filters */}
              {(statusFilter || priorityFilter) && (
                <Button
                  variant="ghost"
                  onClick={onClearFilters}
                  className="gap-2 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={(value: TaskStatus | 'all') => setStatusFilter(value)}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(TASK_STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select value={priorityFilter} onValueChange={(value: TaskPriority | 'all') => setPriorityFilter(value)}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {Object.entries(TASK_PRIORITY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-black">
        <div className="px-2 py-3 lg:p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter || priorityFilter
                  ? 'Try adjusting your filters or search terms'
                  : isAdmin
                  ? 'Create your first task to get started'
                  : 'No tasks have been assigned to you yet'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Responsive Table */}
              <div className="w-full overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead >Employee</TableHead>
                      <TableHead >Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead >Progress</TableHead>
                      <TableHead >Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && tasks.length === 0 ? (
                      // Show skeleton rows when loading and no data exists
                      [...Array(5)].map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                          <TableCell ><Skeleton className="h-8 w-40" /></TableCell>
                          <TableCell ><Skeleton className="h-8 w-20 rounded" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16 rounded" /></TableCell>
                          <TableCell ><Skeleton className="h-8 w-16" /></TableCell>
                          <TableCell ><Skeleton className="h-8 w-24" /></TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-16 rounded ml-auto cursor-pointer" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <>
                        {tasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground line-clamp-2 lg:hidden">
                                {task.description}
                              </div>
                            )}
                            {task.assigned_employee_name && (
                              <div className="text-sm text-muted-foreground md:hidden">
                                {task.assigned_employee_human_readable_id}
                              </div>
                            )}
                            {task.status && (
                              <div className="md:hidden mt-1">
                                <StatusBadge status={task.status} />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell >
                          <div>
                            <div className="font-medium">
                              {task.assigned_employee_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {task.assigned_employee_human_readable_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell >
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={task.priority} />
                        </TableCell>
                        <TableCell >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium min-w-[3rem] text-right">
                              {task.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell >
                          {task.due_date ? (
                            <div>
                              <div className="font-medium">
                                {format(new Date(task.due_date), 'MMM dd, yyyy')}
                              </div>
                              <div className={`text-sm ${
                                new Date(task.due_date) < new Date() && task.status !== 'COMPLETED'
                                  ? 'text-red-600 font-medium'
                                  : 'text-muted-foreground'
                              }`}>
                                {format(new Date(task.due_date), 'HH:mm')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No due date</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onTaskSelect(task)}
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">
                              {isAdmin ? 'Edit' : 'View'}
                            </span>
                          </Button>
                        </TableCell>
                      </TableRow>
                        ))}
                        {!isLoading && tasks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <p className="text-lg font-medium">No tasks found</p>
                                <p className="text-sm">Try adjusting your search or filter criteria</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    {pagination.totalItems > 0 && (
                      <>
                        Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                        {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="cursor-pointer hover:bg-accent transition-colors"
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 py-1 text-sm border rounded">
                      {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="cursor-pointer hover:bg-accent transition-colors"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}