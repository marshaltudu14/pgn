/**
 * Employee Management Client Component
 * Client-side component for interactive employee management functionality
 */

'use client';

import { useState } from 'react';
import { Employee } from '@pgn/shared';
import { EmployeeList } from '@/components/employee-list';
import { EmployeeQuickView } from '@/components/employee-quick-view';
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

  
  const handleQuickViewEdit = (employee: Employee) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/employees/form?id=${employee.id}&mode=edit`);
  };

  return (
    <div className="space-y-6">
      <EmployeeList
        onEmployeeSelect={handleEmployeeSelect}
        onEmployeeEdit={handleEmployeeEdit}
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