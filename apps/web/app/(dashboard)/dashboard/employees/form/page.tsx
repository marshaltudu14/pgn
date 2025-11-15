import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import EmployeeFormClient from './employee-form-client';

export default function EmployeeFormPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="bg-white dark:bg-black border rounded-lg p-6">
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    }>
      <EmployeeFormClient />
    </Suspense>
  );
}