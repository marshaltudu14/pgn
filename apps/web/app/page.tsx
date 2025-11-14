import { redirect } from 'next/navigation';
import LoginForm from './login-form';
import { authService } from '@/services/auth.service';

export default async function Home() {
  // Check if user is already authenticated - if yes, redirect to dashboard immediately
  let currentUser = null;

  try {
    currentUser = await authService.getCurrentUser();
  } catch (error) {
    // Error checking authentication, show login form
    console.error('Error checking authentication:', error);
  }

  if (currentUser) {
    // User is authenticated, redirect to dashboard immediately
    redirect('/dashboard');
  }

  // User is not authenticated, show login form
  return <LoginForm />;
}
