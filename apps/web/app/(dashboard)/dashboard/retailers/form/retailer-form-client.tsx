'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RetailerForm } from '@/components/RetailerForm';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { Retailer } from '@pgn/shared';

export default function RetailerFormClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form mode detection based on URL parameters
  const mode = searchParams.get('mode') || (searchParams.get('id') ? 'edit' : 'create');
  const retailerId = searchParams.get('id');
  const isEditMode = mode === 'edit';

  useEffect(() => {
    async function loadRetailer() {
      if (isEditMode && retailerId) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/retailers/${retailerId}`);
          const result = await response.json();

          if (result.success) {
            setRetailer(result.data);
          } else {
            throw new Error(result.error || 'Failed to fetch retailer');
          }
        } catch (err) {
          console.error('Error loading retailer:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch retailer');
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadRetailer();
  }, [isEditMode, retailerId]);

  const handleFormSuccess = () => {
    // Navigate back to retailer list
    router.push('/dashboard/retailers');
  };

  const handleFormCancel = () => {
    router.push('/dashboard/retailers');
  };

  const pageTitle = isEditMode ? 'Edit Retailer' : 'Create New Retailer';
  const pageDescription = isEditMode
    ? `Update information for ${retailer?.name}`
    : 'Fill in the details to create a new retailer account';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/retailers">Retailers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

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
    );
  }

  if (error && isEditMode) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/retailers">Retailers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Retailer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Alert variant="destructive">
          <AlertDescription>
            Failed to load retailer: {error}. Please try again or contact support.
          </AlertDescription>
        </Alert>

        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
          <Button asChild>
            <Link href="/dashboard/retailers">
              Back to Retailer List
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isEditMode && retailer && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/retailers/${retailerId}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/retailers">Retailers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{pageDescription}</p>
        </div>

        {isEditMode && retailer && (
          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm font-medium">Retailer ID</p>
                <p className="text-lg">{retailer.id}</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-lg">{new Date(retailer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        <RetailerForm
          open={formOpen}
          onOpenChange={setFormOpen}
          retailer={retailer}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    </div>
  );
}