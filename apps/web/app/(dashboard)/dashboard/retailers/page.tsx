import { Metadata } from 'next';
import RetailerListClient from './retailer-list-client';

export const metadata: Metadata = {
  title: 'Retailer Management',
  description: 'Manage retailers, view contact information, and handle retailer operations for PGN organization.',
  keywords: ['retailers', 'retailer management', 'contact management', 'PGN', 'admin dashboard', 'retailer records', 'internal system'],
  robots: 'noindex, nofollow',
};

export default function RetailersPage() {
  return <RetailerListClient />;
}