import { Redirect } from 'expo-router';

export default function DashboardTab() {
  // Redirect to the main dashboard screen
  return <Redirect href="/(dashboard)/dashboard" />;
}