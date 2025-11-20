import { Metadata } from 'next';
import EmployeeListClient from './employees-list-client';

export const metadata: Metadata = {
  title: 'Employee Management',
  description: 'Manage employees, view attendance records, and handle HR operations for PGN organization.',
  keywords: ['employees', 'HR management', 'attendance', 'PGN', 'admin dashboard', 'employee records', 'internal system'],
  robots: 'noindex, nofollow',
};

export default function EmployeesPage() {
  return <EmployeeListClient />;
}