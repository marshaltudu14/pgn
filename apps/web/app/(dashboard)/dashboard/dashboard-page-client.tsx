'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '../../lib/stores/authStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function DashboardPageClient() {
  const { user, isAdmin, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
    // Note: Authentication is handled by proxy middleware
  }, [initialize]);

  const handleEmployeesClick = () => {
    router.push('/dashboard/employees');
  };

  const handleCreateEmployeeClick = () => {
    router.push('/dashboard/employees/create');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 py-6"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}!
        </h2>
        <p className="text-muted-foreground">
          {isAdmin ? 'You have administrator access' : 'You have regular user access'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-background border overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleEmployeesClick}
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-foreground">Employee Management</h3>
                <p className="mt-1 text-sm text-muted-foreground">View and manage employee records</p>
              </div>
            </div>
          </div>
        </motion.div>

        {isAdmin && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-background border overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleCreateEmployeeClick}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-foreground">Create Employee</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Add new employee accounts</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-background border overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-foreground">Attendance Tracking</h3>
                <p className="mt-1 text-sm text-muted-foreground">Monitor employee attendance</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-8">
        <div className="bg-background border overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-foreground">
              System Status
            </h3>
            <div className="mt-5">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                      All systems operational
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <p>Authentication and database services are running normally.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}