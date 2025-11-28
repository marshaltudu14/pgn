/**
 * Farmer Management Client Component
 * Client-side component for interactive farmer management functionality
 */

'use client';

import { useState } from 'react';
import { Farmer } from '@pgn/shared';
import { FarmerList } from '@/components/farmer-list';
import { FarmerQuickView } from '@/components/farmer-quick-view';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useRouter } from 'next/navigation';

export default function FarmerListClient() {
  const router = useRouter();
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

  const handleFarmerSelect = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setShowQuickView(true);
  };

  const handleFarmerEdit = (farmer: Farmer) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/farmers/form?id=${farmer.id}&mode=edit`);
  };

  const handleFarmerCreate = () => {
    // Navigate to the form page with create mode
    router.push('/dashboard/farmers/form?mode=create');
  };

  const handleQuickViewEdit = (farmer: Farmer) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/farmers/form?id=${farmer.id}&mode=edit`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Farmers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <FarmerList
        onFarmerSelect={handleFarmerSelect}
        onFarmerEdit={handleFarmerEdit}
        onFarmerCreate={handleFarmerCreate}
      />

      {/* Farmer Quick View */}
      <FarmerQuickView
        open={showQuickView}
        onOpenChange={setShowQuickView}
        farmer={selectedFarmer}
        onEdit={handleQuickViewEdit}
      />
    </div>
  );
}