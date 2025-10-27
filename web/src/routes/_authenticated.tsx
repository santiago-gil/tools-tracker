import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';

export const Route = createFileRoute('/_authenticated')({
  component: () => <AuthenticatedLayout />,
  beforeLoad: ({ context }) => {
    // If still loading, let the component handle loading state
    if (context.auth.loading) {
      return;
    }

    // Check for authentication errors before checking user
    if (context.auth.error) {
      // Log the authentication error for debugging/reporting
      console.error('Authentication error:', context.auth.error);

      // Redirect to sign-in on authentication error
      throw redirect({ to: '/sign-in' });
    }

    // If not loading and no user, redirect to sign-in
    if (!context.auth.user) {
      throw redirect({ to: '/sign-in' });
    }
  },
});
