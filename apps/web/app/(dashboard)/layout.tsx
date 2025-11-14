import React from 'react';
import DashboardNav from './dashboard/components/dashboard-nav';
import ErrorBoundary from './dashboard/components/ui/error-boundary';
import Notifications from './dashboard/components/ui/notifications';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: Authentication is handled by proxy middleware
  // Only authenticated users should reach this layout

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        <DashboardNav />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <Notifications />
    </ErrorBoundary>
  );
}