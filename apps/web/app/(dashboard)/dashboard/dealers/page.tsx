import { Metadata } from 'next';
import DealerListClient from './dealer-list-client';

export const metadata: Metadata = {
  title: 'Dealer Management',
  description: 'Manage dealers, view contact information, and handle dealer operations for PGN organization.',
  keywords: ['dealers', 'dealer management', 'contact management', 'PGN', 'admin dashboard', 'dealer records', 'internal system'],
  robots: 'noindex, nofollow',
};

export default function DealersPage() {
  return <DealerListClient />;
}