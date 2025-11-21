import { Metadata } from 'next';
import AttendanceManagementClient from './attendance-management-client';

export const metadata: Metadata = {
  title: 'Attendance Management',
  description: 'Monitor and verify employee attendance, check-in/check-out records, and location tracking data for PGN organization.',
  keywords: ['attendance', 'employee monitoring', 'check-in', 'check-out', 'location tracking', 'PGN', 'admin dashboard', 'verification', 'internal system'],
  robots: 'noindex, nofollow',
};

export default function AttendancePage() {
  return <AttendanceManagementClient />;
}