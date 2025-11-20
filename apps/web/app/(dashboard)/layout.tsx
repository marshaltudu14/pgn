import type { Metadata } from 'next';
import DashboardLayoutClient from './dashboard-layout-client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Secure admin dashboard for PGN location tracking and attendance management system. Access employee management, regions, attendance records, and settings.',
  keywords: ['PGN dashboard', 'admin panel', 'employee management', 'attendance tracking', 'face recognition', 'location monitoring', 'HR analytics', 'internal system'],
  robots: 'noindex, nofollow, noarchive, nosnippet, notranslate, noimageindex', // Block all indexing for internal dashboard
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
