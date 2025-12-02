import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Metadata } from 'next';
import RetailerFormClient from './retailer-form-client';

export const metadata: Metadata = {
  title: 'Retailer Form',
  description: 'Create and edit retailer profiles with contact information and shop details.',
  keywords: ['retailer form', 'retailer management', 'contact management', 'PGN', 'internal system'],
  robots: 'noindex, nofollow',
};

export default function RetailerFormPage() {
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
      <RetailerFormClient />
    </Suspense>
  );
}