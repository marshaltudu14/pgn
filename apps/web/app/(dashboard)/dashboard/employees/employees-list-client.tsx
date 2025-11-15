/**
 * Employee Management Client Component
 * Client-side component for interactive employee management functionality
 */

'use client';

import { useState } from 'react';
import { Employee, EmploymentStatus } from '@pgn/shared';
import { EmployeeList } from '@/components/employee-list';
import { EmployeeQuickView } from '@/components/employee-quick-view';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useRouter } from 'next/navigation';

export default function EmployeeListClient() {
  const router = useRouter();
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowQuickView(true);
  };

  const handleEmployeeEdit = (employee: Employee) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/employees/form?id=${employee.id}&mode=edit`);
  };

  const handleEmployeeCreate = () => {
    // Navigate to the form page with create mode
    router.push('/dashboard/employees/form?mode=create');
  };

  const handleEmployeeStatusChange = (employee: Employee, status: EmploymentStatus) => {
    // Status change is handled in the employee list component
    console.log('Employee status changed:', employee, status);
  };

  const handleQuickViewEdit = (employee: Employee) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/employees/form?id=${employee.id}&mode=edit`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Employees</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

  
      <EmployeeList
        onEmployeeSelect={handleEmployeeSelect}
        onEmployeeEdit={handleEmployeeEdit}
        onEmployeeStatusChange={handleEmployeeStatusChange}
        onEmployeeCreate={handleEmployeeCreate}
      />

      {/* Employee Quick View */}
      <EmployeeQuickView
        open={showQuickView}
        onOpenChange={setShowQuickView}
        employee={selectedEmployee}
        onEdit={handleQuickViewEdit}
      />
    </div>
  );
}