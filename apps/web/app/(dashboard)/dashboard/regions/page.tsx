import { Metadata } from 'next';
import RegionsManagementClient from './regions-management-client';

export const metadata: Metadata = {
  title: 'Regions Management',
  description: 'Manage states, districts, and cities across India. Add, edit, and delete regional locations with automatic slug generation.',
  keywords: ['regions', 'states', 'districts', 'cities', 'location management', 'PGN', 'admin dashboard', 'internal system'],
  robots: 'noindex, nofollow',
};

export default function RegionsPage() {
  return <RegionsManagementClient />;
}