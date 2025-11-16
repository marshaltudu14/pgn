import { Slot } from 'expo-router';
import { AuthGuard } from '@/utils/auth-guard';

export default function DashboardLayout() {
  return (
    <AuthGuard requireAuth={true}>
      <Slot />
    </AuthGuard>
  );
}