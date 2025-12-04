/**
 * Retailer Management Client Component
 * Client-side component for interactive retailer management functionality
 */

'use client';

import { useState } from 'react';
import { RetailerWithFarmers } from '@pgn/shared';
import { RetailerList } from '@/components/retailer-list';
import { RetailerQuickView } from '@/components/retailer-quick-view';
import { useRouter } from 'next/navigation';

export default function RetailerListClient() {
  const router = useRouter();
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<RetailerWithFarmers | null>(null);

  const handleRetailerSelect = (retailer: RetailerWithFarmers) => {
    setSelectedRetailer(retailer);
    setShowQuickView(true);
  };

  const handleRetailerEdit = (retailer: RetailerWithFarmers) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/retailers/form?id=${retailer.id}&mode=edit`);
  };

  const handleRetailerCreate = () => {
    // Navigate to the form page with create mode
    router.push('/dashboard/retailers/form?mode=create');
  };

  const handleQuickViewEdit = (retailer: RetailerWithFarmers) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/retailers/form?id=${retailer.id}&mode=edit`);
  };

  return (
    <div className="space-y-6">
      <RetailerList
        onRetailerSelect={handleRetailerSelect}
        onRetailerEdit={handleRetailerEdit}
        onRetailerCreate={handleRetailerCreate}
      />

      {/* Retailer Quick View */}
      <RetailerQuickView
        open={showQuickView}
        onOpenChange={setShowQuickView}
        retailer={selectedRetailer}
        onEdit={handleQuickViewEdit}
      />
    </div>
  );
}