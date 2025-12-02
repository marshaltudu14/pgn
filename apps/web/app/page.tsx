import LoginForm from './login-form';

// This page should be static - the LoginForm component will handle client-side auth checks
// and server actions for authentication. Server-side auth checks should be done in
// protected routes, not the public landing page.
export default async function Home() {
  // Public landing page - show login form
  // Authentication checks happen in the LoginForm component and protected routes
  return <LoginForm />;
}
