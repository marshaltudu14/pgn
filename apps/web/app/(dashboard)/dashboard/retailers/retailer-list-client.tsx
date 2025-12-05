/**
 * Retailer Management Client Component
 * Client-side component for interactive retailer management functionality
 */

'use client';

import { RetailerWithFarmers } from '@pgn/shared';
import { RetailerList } from '@/components/retailer-list';
import { useRouter } from 'next/navigation';

export default function RetailerListClient() {
  const router = useRouter();

  
  const handleRetailerEdit = (retailer: RetailerWithFarmers) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/retailers/form?id=${retailer.id}&mode=edit`);
  };

  const handleRetailerCreate = () => {
    // Navigate to the form page with create mode
    router.push('/dashboard/retailers/form?mode=create');
  };

  
  return (
    <div className="space-y-6">
      <RetailerList
        onRetailerEdit={handleRetailerEdit}
        onRetailerCreate={handleRetailerCreate}
      />
    </div>
  );
}