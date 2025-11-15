'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EmployeeForm } from '@/components/employee-form';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink,BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { Employee } from '@pgn/shared';

export default function EmployeeFormClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form mode detection based on URL parameters
  const mode = searchParams.get('mode') || (searchParams.get('id') ? 'edit' : 'create');
  const employeeId = searchParams.get('id');
  const isEditMode = mode === 'edit';

  useEffect(() => {
    async function loadEmployee() {
      if (isEditMode && employeeId) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/employees/${employeeId}`);
          const result = await response.json();

          if (result.success) {
            setEmployee(result.data);
          } else {
            throw new Error(result.error || 'Failed to fetch employee');
          }
        } catch (err) {
          console.error('Error loading employee:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch employee');
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadEmployee();
  }, [isEditMode, employeeId]);

  const handleFormSuccess = () => {
    // Navigate back to employee list or to detail view
    if (isEditMode) {
      router.push(`/dashboard/employees/${employeeId}`);
    } else {
      router.push('/dashboard/employees');
    }
  };

  const handleFormCancel = () => {
    router.push('/dashboard/employees');
  };

  const pageTitle = isEditMode ? 'Edit Employee' : 'Create New Employee';
  const pageDescription = isEditMode
    ? `Update information for ${employee?.first_name} ${employee?.last_name}`
    : 'Fill in the details to create a new employee account';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/employees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/employees">Employees</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="bg-white dark:bg-black border rounded-lg p-6">
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && isEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/employees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/employees">Employees</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Employee</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Alert variant="destructive">
          <AlertDescription>
            Failed to load employee: {error}. Please try again or contact support.
          </AlertDescription>
        </Alert>

        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <Button asChild>
            <Link href="/dashboard/employees">
              Back to Employee List
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/employees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
          {isEditMode && employee && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/employees/${employeeId}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/employees">Employees</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{pageDescription}</p>
        </div>

        {isEditMode && employee && (
          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm font-medium">Employee ID</p>
                <p className="text-lg">{employee.human_readable_user_id}</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-lg">{employee.employment_status.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        <EmployeeForm
          open={formOpen}
          onOpenChange={setFormOpen}
          employee={employee}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    </div>
  );
}