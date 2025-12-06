'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useAuthStore } from '../../lib/stores/authStore';
import TrackingView from './components/TrackingView';

function DashboardPageContent() {
  const { user, isAdmin, initialize } = useAuthStore();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleEmployeesClick = () => router.push('/dashboard/employees');
  const handleCreateEmployeeClick = () => router.push('/dashboard/employees/create');

  if (currentView === 'tracking') {
    return (
      <div className="h-full w-full bg-muted/5 flex flex-col overflow-hidden">
        <TrackingView />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-muted/5 p-6 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
          {/* Welcome Banner - now more subtle and integrated */}
          <div className="flex flex-col gap-1 mb-8">
            <h2 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.firstName || 'User'}
            </h2>
            <p className="text-muted-foreground">
              {isAdmin ? 'Administrator Panel' : 'Employee Portal'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ y: -2 }}
              onClick={handleEmployeesClick}
              className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Total Employees</h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">Manage</div>
                <p className="text-xs text-muted-foreground">View and edit records</p>
              </div>
            </motion.div>

            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -2 }}
                onClick={handleCreateEmployeeClick}
                className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Onboard</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" x2="19" y1="8" y2="14" />
                    <line x1="22" x2="16" y1="11" y2="11" />
                  </svg>
                </div>
                <div className="p-6 pt-0">
                  <div className="text-2xl font-bold">Add New</div>
                  <p className="text-xs text-muted-foreground">Register new employee</p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -2 }}
              className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow hover:shadow-lg transition-all"
            >
              <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">System Status</h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-green-500"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">Stable</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
            </motion.div>
          </div>
      </motion.div>
    </div>
  );
}

export default function DashboardPageClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}