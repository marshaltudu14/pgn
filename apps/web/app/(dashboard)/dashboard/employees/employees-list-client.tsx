/**
 * Employee Management Client Component
 * Client-side component for interactive employee management functionality
 */

'use client';

import { useState } from 'react';
import { EmployeeWithRegions } from '@pgn/shared';
import { EmployeeList } from '@/components/employee-list';
import { EmployeeQuickView } from '@/components/employee-quick-view';
import { useRouter } from 'next/navigation';

export default function EmployeeListClient() {
  const router = useRouter();
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithRegions | null>(null);

  const handleEmployeeSelect = (employee: EmployeeWithRegions | null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setShowQuickView(true);
    } else {
      setSelectedEmployee(null);
      setShowQuickView(false);
    }
  };

  const handleEmployeeEdit = async (employee: EmployeeWithRegions) => {
    try {
      // Navigate to the form page with edit mode
      await router.push(`/dashboard/employees/form?id=${employee.id}&mode=edit`);
    } catch (error) {
      console.error('Navigation failed:', error);
      // Optionally show user feedback about navigation failure
    }
  };

  const handleEmployeeCreate = async () => {
    try {
      // Navigate to the form page with create mode
      await router.push('/dashboard/employees/form?mode=create');
    } catch (error) {
      console.error('Navigation failed:', error);
      // Optionally show user feedback about navigation failure
    }
  };


  const handleQuickViewEdit = async (employee: EmployeeWithRegions) => {
    try {
      // Navigate to the form page with edit mode
      await router.push(`/dashboard/employees/form?id=${employee.id}&mode=edit`);
    } catch (error) {
      console.error('Navigation failed:', error);
      // Optionally show user feedback about navigation failure
    }
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