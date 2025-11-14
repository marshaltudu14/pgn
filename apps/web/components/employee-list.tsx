/**
 * Employee List Component
 * Displays a searchable, filterable, and paginated list of employees
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Employee, EmploymentStatus, EmployeeListParams } from '@pgn/shared';
import { Search, Filter, Plus, Edit, Trash2, Eye, UserCheck } from 'lucide-react';

interface EmployeeListProps {
  onEmployeeSelect?: (employee: Employee) => void;
  onEmployeeEdit?: (employee: Employee) => void;
  onEmployeeDelete?: (employee: Employee) => void;
  onEmployeeStatusChange?: (employee: Employee, status: EmploymentStatus) => void;
  onEmployeeCreate?: () => void;
}

const EMPLOYMENT_STATUS_COLORS: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  RESIGNED: 'bg-blue-100 text-blue-800',
  TERMINATED: 'bg-red-100 text-red-800',
  ON_LEAVE: 'bg-gray-100 text-gray-800',
};

const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'];

export function EmployeeList({
  onEmployeeSelect,
  onEmployeeEdit,
  onEmployeeDelete,
  onEmployeeStatusChange,
  onEmployeeCreate,
}: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<EmploymentStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState<Employee | null>(null);
  const [statusChangeEmployee, setStatusChangeEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params: EmployeeListParams = {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        employment_status: selectedStatus !== 'all' ? [selectedStatus] : undefined,
        sort_by: 'created_at',
        sort_order: 'desc',
      };

      const response = await fetch('/api/employees?' + new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '20',
        ...(params.search && { search: params.search }),
        ...(params.employment_status && { employment_status: params.employment_status.join(',') }),
        sort_by: params.sort_by || 'created_at',
        sort_order: params.sort_order || 'desc',
      }));

      const result = await response.json();

      if (result.success) {
        setEmployees(result.data.employees);
        setTotalPages(Math.ceil(result.data.total / result.data.limit));
        setTotalCount(result.data.total);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch employees');
      }
    } catch (err) {
      setError('An error occurred while fetching employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus]);

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm, selectedStatus, fetchEmployees]);

  const handleDeleteEmployee = async (employee: Employee) => {
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setDeleteConfirmEmployee(null);
        await fetchEmployees();
        onEmployeeDelete?.(employee);
      } else {
        setError(result.error || 'Failed to delete employee');
      }
    } catch (err) {
      setError('An error occurred while deleting employee');
      console.error('Error deleting employee:', err);
    }
  };

  const handleStatusChange = async (employee: Employee, newStatus: EmploymentStatus) => {
    try {
      const response = await fetch(`/api/employees/${employee.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employmentStatus: newStatus,
          changed_by: 'admin', // Would come from auth context
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatusChangeEmployee(null);
        await fetchEmployees();
        onEmployeeStatusChange?.(employee, newStatus);
      } else {
        setError(result.error || 'Failed to update employment status');
      }
    } catch (err) {
      setError('An error occurred while updating employment status');
      console.error('Error updating employment status:', err);
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
        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-muted-foreground">
            {totalCount} employee{totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={onEmployeeCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as EmploymentStatus | 'all')}>
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                  <TableRow key={employee.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {employee.humanReadableUserId}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
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
                      <Badge className={EMPLOYMENT_STATUS_COLORS[employee.employmentStatus]}>
                        {employee.employmentStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{employee.primaryRegion || '-'}</div>
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
                                Change the employment status for {employee.firstName} {employee.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Select
                                value={statusChangeEmployee?.employmentStatus}
                                onValueChange={(value) =>
                                  setStatusChangeEmployee(prev => prev ? {...prev, employmentStatus: value as EmploymentStatus} : null)
                                }
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
                                  onClick={() => setStatusChangeEmployee(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => statusChangeEmployee && handleStatusChange(employee, statusChangeEmployee.employmentStatus)}
                                >
                                  Update Status
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog
                          open={!!deleteConfirmEmployee}
                          onOpenChange={() => setDeleteConfirmEmployee(null)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmEmployee(employee)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark {employee.firstName} {employee.lastName} as terminated.
                                This action can be reversed by updating their employment status.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteConfirmEmployee && handleDeleteEmployee(deleteConfirmEmployee)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}