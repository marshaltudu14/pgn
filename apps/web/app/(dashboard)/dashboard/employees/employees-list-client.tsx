/**
 * Employee Management Client Component
 * Client-side component for interactive employee management functionality
 */

'use client';

import { useState } from 'react';
import { Employee, EmploymentStatus } from '@pgn/shared';
import { EmployeeList } from '@/components/employee-list';
import { EmployeeForm } from '@/components/employee-form';
import { EmployeeDetail } from '@/components/employee-detail';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function EmployeeListClient() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetail(true);
  };

  const handleEmployeeEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditForm(true);
  };

  const handleEmployeeCreate = () => {
    setSelectedEmployee(null);
    setShowCreateForm(true);
  };

  const handleEmployeeDelete = (employee: Employee) => {
    // Delete action is handled in the employee list component
    console.log('Employee deleted:', employee);
  };

  const handleEmployeeStatusChange = (employee: Employee, status: EmploymentStatus) => {
    // Status change is handled in the employee list component
    console.log('Employee status changed:', employee, status);
  };

  const handleFormSuccess = () => {
    // Close any open forms and refresh the employee list
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedEmployee(null);
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

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
        <p className="text-muted-foreground">
          Manage employee accounts, access control, and regional assignments
        </p>
      </div>

      <EmployeeList
        onEmployeeSelect={handleEmployeeSelect}
        onEmployeeEdit={handleEmployeeEdit}
        onEmployeeDelete={handleEmployeeDelete}
        onEmployeeStatusChange={handleEmployeeStatusChange}
        onEmployeeCreate={handleEmployeeCreate}
      />

      {/* Create Employee Form */}
      <EmployeeForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        employee={null}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Employee Form */}
      <EmployeeForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        employee={selectedEmployee}
        onSuccess={handleFormSuccess}
      />

      {/* Employee Detail View */}
      <EmployeeDetail
        open={showDetail}
        onOpenChange={setShowDetail}
        employee={selectedEmployee}
        onEdit={handleEmployeeEdit}
      />
    </div>
  );
}