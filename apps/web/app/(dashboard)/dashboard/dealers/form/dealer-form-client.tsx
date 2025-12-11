'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DealerForm } from '@/components/DealerForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { Dealer } from '@pgn/shared';

export default function DealerFormClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form mode detection based on URL parameters
  const mode = searchParams.get('mode') || (searchParams.get('id') ? 'edit' : 'create');
  const dealerId = searchParams.get('id');
  const isEditMode = mode === 'edit';

  useEffect(() => {
    async function loadDealer() {
      if (isEditMode && dealerId) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/dealers/${dealerId}`);
          const result = await response.json();

          if (result.success) {
            setDealer(result.data);
          } else {
            throw new Error(result.error || 'Failed to fetch dealer');
          }
        } catch (err) {
          console.error('Error loading dealer:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch dealer');
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadDealer();
  }, [isEditMode, dealerId]);

  const handleFormSuccess = () => {
    // Navigate back to dealer list
    router.push('/dashboard/dealers');
  };

  const handleFormCancel = () => {
    router.push('/dashboard/dealers');
  };

  const pageTitle = isEditMode ? 'Edit Dealer' : 'Create New Dealer';
  const pageDescription = isEditMode
    ? `Update information for ${dealer?.name}`
    : 'Fill in the details to create a new dealer account';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
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
      </div>
    );
  }

  if (error && isEditMode) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load dealer: {error}. Please try again or contact support.
            </AlertDescription>
          </Alert>

          <div className="flex space-x-4 mt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button asChild>
              <Link href="/dashboard/dealers">
                Back to Dealer List
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground mt-2">{pageDescription}</p>
          </div>
          <div className="flex items-center space-x-4">
            {isEditMode && dealer && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/dealers/${dealerId}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
            )}
          </div>
        </div>

        
        <DealerForm
          dealer={dealer}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    </div>
  );
}