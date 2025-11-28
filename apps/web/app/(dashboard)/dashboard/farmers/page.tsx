import { Metadata } from 'next';
import FarmerListClient from './farmer-list-client';

export const metadata: Metadata = {
  title: 'Farmer Management',
  description: 'Manage farmers, view contact information, and handle farmer operations for PGN organization.',
  keywords: ['farmers', 'farmer management', 'contact management', 'PGN', 'admin dashboard', 'farmer records', 'internal system'],
  robots: 'noindex, nofollow',
};

export default function FarmersPage() {
  return <FarmerListClient />;
}