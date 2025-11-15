/**
 * Employee List Component
 * Displays a searchable, filterable, and paginated list of employees
 */

'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Employee, EmploymentStatus } from '@pgn/shared';
import { useEmployeeStore } from '@/app/lib/stores/employeeStore';
import { Search, Filter, Plus, Edit, Eye, UserCheck } from 'lucide-react';

interface EmployeeListProps {
  onEmployeeSelect?: (employee: Employee) => void;
  onEmployeeEdit?: (employee: Employee) => void;
  onEmployeeStatusChange?: (employee: Employee, status: EmploymentStatus) => void;
  onEmployeeCreate?: () => void;
}

const EMPLOYMENT_STATUS_COLORS: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  SUSPENDED: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
  RESIGNED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  TERMINATED: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
  ON_LEAVE: 'bg-muted text-muted-foreground',
};

const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'];

export function EmployeeList({
  onEmployeeSelect,
  onEmployeeEdit,
  onEmployeeStatusChange,
  onEmployeeCreate,
}: EmployeeListProps) {
  const {
    employees,
    loading,
    error,
    pagination,
    filters,
    fetchEmployees,
    updateEmploymentStatus,
    setFilters,
    setPagination,
    clearError,
  } = useEmployeeStore();

  const [statusChangeEmployee, setStatusChangeEmployee] = useState<Employee | null>(null);
  const [tempStatusForDialog, setTempStatusForDialog] = useState<EmploymentStatus>('ACTIVE');

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearchChange = (value: string) => {
    setFilters({ search: value });
    setPagination(1); // Reset to first page
  };

  const handleStatusChange = (value: EmploymentStatus | 'all') => {
    setFilters({ status: value });
    setPagination(1); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(1, size); // Reset to first page with new page size
  };

  
  const handleStatusChangeSubmit = async (employee: Employee, newStatus: EmploymentStatus) => {
    const result = await updateEmploymentStatus(employee.id, {
      employment_status: newStatus,
      changed_by: 'admin', // Would come from auth context
    });
    if (result.success) {
      setStatusChangeEmployee(null);
      onEmployeeStatusChange?.(employee, newStatus);
    }
  };

  if (loading && employees.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Employees</h2>
          <Button onClick={onEmployeeCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
        <div className="bg-white dark:bg-black border rounded-lg">
          <div className="p-6 border-b">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 p-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-muted-foreground">
            {pagination.totalItems} employee{pagination.totalItems !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={onEmployeeCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex justify-between items-center">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-black border rounded-lg">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => handleStatusChange(value as EmploymentStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {EMPLOYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-6">
          <div className="rounded-md border w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Primary Region</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {employee.human_readable_user_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{employee.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{employee.phone || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={EMPLOYMENT_STATUS_COLORS[employee.employment_status as EmploymentStatus]}>
                        {employee.employment_status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{employee.primary_region || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEmployeeSelect?.(employee)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEmployeeEdit?.(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Dialog
                          open={!!statusChangeEmployee}
                          onOpenChange={() => setStatusChangeEmployee(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStatusChangeEmployee(employee)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Employment Status</DialogTitle>
                              <DialogDescription>
                                Change the employment status for {employee.first_name} {employee.last_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Select
                                value={tempStatusForDialog}
                                onValueChange={(value) => setTempStatusForDialog(value as EmploymentStatus)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {EMPLOYMENT_STATUSES.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      <div className="flex items-center gap-2">
                                        <Badge className={EMPLOYMENT_STATUS_COLORS[status]} variant="outline">
                                          {status.replace('_', ' ')}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setStatusChangeEmployee(null);
                                    setTempStatusForDialog('ACTIVE');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleStatusChangeSubmit(employee, tempStatusForDialog)}
                                >
                                  Update Status
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
                </div>
                <Select
                  value={pagination.itemsPerPage.toString()}
                  onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}