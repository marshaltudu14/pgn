import { Redirect } from 'expo-router';

export default function ProfileTab() {
  // Redirect to the main profile screen in dashboard
  return <Redirect href="/(dashboard)/profile" />;
}