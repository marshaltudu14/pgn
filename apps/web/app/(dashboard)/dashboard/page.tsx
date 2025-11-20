import type { Metadata } from 'next';
import DashboardPageClient from './dashboard-page-client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'PGN admin dashboard for managing employees, tracking attendance, and monitoring system status.',
  keywords: ['dashboard', 'PGN', 'admin', 'overview', 'system status', 'employee management', 'internal system'],
  robots: 'noindex, nofollow',
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}