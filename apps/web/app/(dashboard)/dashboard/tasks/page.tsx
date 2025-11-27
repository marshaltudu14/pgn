import { Metadata } from 'next';
import TaskManagementClient from './task-management-client';

export const metadata: Metadata = {
  title: 'Task Management',
  description: 'Assign and track tasks for sales team members in PGN organization. Monitor task progress, completion status, and performance.',
  keywords: ['task management', 'employee tasks', 'sales team', 'task tracking', 'PGN', 'admin dashboard', 'task assignment', 'progress monitoring'],
  robots: 'noindex, nofollow',
};

export default function TasksPage() {
  return <TaskManagementClient />;
}