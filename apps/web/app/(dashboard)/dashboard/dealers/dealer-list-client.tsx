/**
 * Dealer Management Client Component
 * Client-side component for interactive dealer management functionality
 */

'use client';

import { useState } from 'react';
import { Dealer } from '@pgn/shared';
import { DealerList } from '@/components/dealer-list';
import { DealerQuickView } from '@/components/dealer-quick-view';
import { useRouter } from 'next/navigation';

export default function DealerListClient() {
  const router = useRouter();
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  const handleDealerSelect = (dealer: Dealer) => {
    setSelectedDealer(dealer);
    setShowQuickView(true);
  };

  const handleDealerEdit = (dealer: Dealer) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/dealers/form?id=${dealer.id}&mode=edit`);
  };

  const handleDealerCreate = () => {
    // Navigate to the form page with create mode
    router.push('/dashboard/dealers/form?mode=create');
  };

  const handleQuickViewEdit = (dealer: Dealer) => {
    // Navigate to the form page with edit mode
    router.push(`/dashboard/dealers/form?id=${dealer.id}&mode=edit`);
  };

  return (
    <div className="space-y-6">
      <DealerList
        onDealerSelect={handleDealerSelect}
        onDealerEdit={handleDealerEdit}
        onDealerCreate={handleDealerCreate}
      />

      {/* Dealer Quick View */}
      <DealerQuickView
        open={showQuickView}
        onOpenChange={setShowQuickView}
        dealer={selectedDealer}
        onEdit={handleQuickViewEdit}
      />
    </div>
  );
}