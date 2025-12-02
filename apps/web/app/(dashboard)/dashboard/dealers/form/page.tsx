import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Metadata } from 'next';
import DealerFormClient from './dealer-form-client';

export const metadata: Metadata = {
  title: 'Dealer Form',
  description: 'Create and edit dealer profiles with contact information and shop details.',
  keywords: ['dealer form', 'dealer management', 'contact management', 'PGN', 'internal system'],
  robots: 'noindex, nofollow',
};

export default function DealerFormPage() {
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
      <DealerFormClient />
    </Suspense>
  );
}