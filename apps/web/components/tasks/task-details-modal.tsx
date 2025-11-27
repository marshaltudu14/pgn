/**
 * Task Details Modal Component
 * Displays detailed task information and allows editing
 */

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Task, TaskStatus, TaskPriority, UpdateTaskRequest } from '@pgn/shared';
import { Calendar, Clock, User, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';

// Status configuration
const TASK_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    dotColor: 'bg-yellow-500',
    icon: Circle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    dotColor: 'bg-blue-500',
    icon: AlertCircle,
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    dotColor: 'bg-green-500',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    dotColor: 'bg-red-500',
    icon: AlertCircle,
  },
  ON_HOLD: {
    label: 'On Hold',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    dotColor: 'bg-gray-500',
    icon: AlertCircle,
  },
} as const;

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
} as const;

interface TaskDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onUpdate: (taskId: string, updateData: UpdateTaskRequest) => Promise<void>;
  isUpdating: boolean;
  updateError: string | null;
  isAdmin: boolean;
}

export default function TaskDetailsModal({
  open,
  onOpenChange,
  task,
  onUpdate: _onUpdate,
  isUpdating: _isUpdating,
  updateError: _updateError,
  isAdmin: _isAdmin,
}: TaskDetailsModalProps) {

  const isOverdue = task?.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED';

  if (!task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white dark:bg-black text-foreground">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>No task selected</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${TASK_STATUS_CONFIG[task.status as TaskStatus]?.className}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${TASK_STATUS_CONFIG[task.status as TaskStatus]?.dotColor}`} />
              {TASK_STATUS_CONFIG[task.status as TaskStatus]?.label}
            </span>
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {_updateError && (
            <div className="bg-destructive/15 border border-destructive/50 text-destructive p-3 rounded-md">
              <p className="text-sm">{_updateError}</p>
            </div>
          )}

          {/* Task Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{task.assigned_employee_name || 'Unknown'}</span>
                <span className="text-muted-foreground">({task.assigned_employee_human_readable_id})</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${TASK_PRIORITY_CONFIG[task.priority as TaskPriority]?.className}`}>
                {TASK_PRIORITY_CONFIG[task.priority as TaskPriority]?.label}
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {task.due_date ? (
                  <>
                    <span>{format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                    <span>{format(new Date(task.due_date), 'HH:mm')}</span>
                    {isOverdue && <span className="text-xs font-medium">(OVERDUE)</span>}
                  </>
                ) : (
                  <span className="text-muted-foreground">No due date</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Created</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{format(task.created_at ? new Date(task.created_at) : new Date(), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Progress</Label>
              <span className="text-sm font-medium">{task.progress || 0}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${task.progress || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          
          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Last updated: {format(new Date(task.updated_at || task.created_at || new Date()), 'MMM dd, yyyy HH:mm')}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}