/**
 * Farmer Management Client Component
 * Client-side component for interactive farmer management functionality
 */

'use client';

import { FarmerWithRetailer } from '@pgn/shared';
import { FarmerList } from '@/components/farmer-list';
import { useRouter } from 'next/navigation';

export default function FarmerListClient() {
  const router = useRouter();

  
  const handleFarmerEdit = (farmer: FarmerWithRetailer) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/farmers/form?id=${farmer.id}&mode=edit`);
  };

  const handleFarmerCreate = () => {
    // Navigate to the form page with create mode
    router.push('/dashboard/farmers/form?mode=create');
  };

  
  return (
    <div className="space-y-6">
      <FarmerList
        onFarmerEdit={handleFarmerEdit}
        onFarmerCreate={handleFarmerCreate}
      />
    </div>
  );
}