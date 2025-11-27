/**
 * Task Create Modal Component
 * Form for creating new tasks
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateTaskRequest, TaskPriority } from '@pgn/shared';
import { Command, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: (taskData: CreateTaskRequest) => Promise<void>;
  isCreating: boolean;
}

interface Employee {
  id: string;
  human_readable_user_id: string;
  first_name: string;
  display_name: string;
}

export function TaskCreateModal({
  open,
  onOpenChange,
  onTaskCreated,
  isCreating,
}: TaskCreateModalProps) {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    assigned_employee_id: '',
    priority: 'MEDIUM',
    due_date: undefined,
  });

  // Employee search state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [openEmployeeSearch, setOpenEmployeeSearch] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Handle employee data loading (both initial load and search)
  useEffect(() => {
    // Only load when popover is open and not already loading
    if (!openEmployeeSearch || isLoading) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const loadEmployees = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10'
        });

        // Only add search parameter if it's not empty
        if (searchTerm.trim() !== '') {
          params.append('search', searchTerm.trim());
        }

        const response = await fetch(`/api/employees/search?${params}`);
        if (!response.ok) throw new Error('Failed to fetch employees');

        const data = await response.json();
        if (data.success) {
          setEmployees(data.data.employees);
          setHasMore(data.data.pagination.hasMore);
          setPage(1);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // If there's a search term, use debounce. If not, load immediately for initial display.
    if (searchTerm.trim() !== '') {
      searchTimeoutRef.current = setTimeout(() => {
        setPage(1);
        setHasMore(true);
        loadEmployees();
      }, 300);
    } else {
      // Load immediately for empty search or initial load
      setPage(1);
      setHasMore(true);
      loadEmployees();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [openEmployeeSearch, searchTerm, isLoading]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current || !hasMore || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;

    // When user is near bottom (within 100px), load more
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      const loadMoreEmployees = async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
          const params = new URLSearchParams({
            page: (page + 1).toString(),
            limit: '10'
          });

          // Only add search parameter if it's not empty
          if (searchTerm.trim() !== '') {
            params.append('search', searchTerm.trim());
          }

          const response = await fetch(`/api/employees/search?${params}`);
          if (!response.ok) throw new Error('Failed to fetch employees');

          const data = await response.json();
          if (data.success) {
            const newEmployees = data.data.employees;
            setEmployees(prev => [...prev, ...newEmployees]);
            setHasMore(data.data.pagination.hasMore);
            setPage(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error fetching more employees:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadMoreEmployees();
    }
  }, [hasMore, isLoading, searchTerm, page]);

  // Handle employee selection
  const handleSelectEmployee = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({ ...prev, assigned_employee_id: employee.id }));
    setOpenEmployeeSearch(false);
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assigned_employee_id: '',
      priority: 'MEDIUM',
      due_date: undefined,
    });
    setSelectedEmployee(null);
    setEmployees([]);
    setSearchTerm('');
    setPage(1);
    setHasMore(true);
    setIsLoading(false);
  };

  // Handle modal close with form reset
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.assigned_employee_id) {
      return;
    }

    try {
      await onTaskCreated(formData);
    } catch {
      // Error handling is done in parent component
    }
  };

  
  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      due_date: value ? new Date(value) : undefined,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black text-foreground">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                required
                className="w-full"
              />
            </div>

            {/* Assigned Employee */}
            <div className="space-y-2">
              <Label>Assigned Employee *</Label>
              <Popover open={openEmployeeSearch} onOpenChange={setOpenEmployeeSearch}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEmployeeSearch}
                    className="w-full justify-between text-left font-normal"
                  >
                    {selectedEmployee ? selectedEmployee.display_name : "Search employees..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                      <CommandInput
                        placeholder="Search by ID or name..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
                      />
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                    </div>

                    <ScrollArea
                      ref={scrollAreaRef}
                      onScrollCapture={handleScroll}
                      className="h-[300px]"
                    >
                      <CommandList>
                        {employees.length === 0 && !isLoading && (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No employees found
                          </div>
                        )}

                        {employees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={employee.id}
                            onSelect={() => handleSelectEmployee(employee)}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{employee.first_name}</span>
                              <span className="text-sm text-muted-foreground">
                                {employee.human_readable_user_id}
                              </span>
                            </div>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedEmployee?.id === employee.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}

                        {/* Loading indicator for infinite scroll */}
                        {isLoading && hasMore && (
                          <div className="py-2 text-center text-sm text-muted-foreground">
                            Loading more employees...
                          </div>
                        )}

                        {/* End of results indicator */}
                        {!hasMore && employees.length > 0 && (
                          <div className="py-2 text-center text-sm text-muted-foreground">
                            No more employees to load
                          </div>
                        )}
                      </CommandList>
                    </ScrollArea>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={4}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.due_date ? new Date(formData.due_date).toISOString().slice(0, 16) : ''}
                onChange={handleDueDateChange}
                className="w-full"
              />
            </div>
          </div>

          
          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !formData.title.trim() || !formData.assigned_employee_id}
            >
              {isCreating ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}