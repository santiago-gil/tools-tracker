import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { buildRedirectTo } from '../utils/urlValidation';

export const Route = createFileRoute('/_authenticated')({
  component: () => <AuthenticatedLayout />,
  beforeLoad: ({ context, location }) => {
    // Don't redirect if we're already on the sign-in page
    if (location.pathname === '/sign-in') {
      return;
    }

    // Only perform redirect logic if NOT loading
    // The AuthenticatedLayout component's useEffect handles the redirect
    // after loading completes, so we can skip the beforeLoad redirect
    // This avoids issues with nested routes changing location between calls
    if (!context.auth.loading) {
      // Check for authentication errors before checking user
      if (context.auth.error) {
        // Log the authentication error for debugging/reporting
        console.error('Authentication error:', context.auth.error);
        // Let AuthenticatedLayout handle the redirect to preserve full path
        return;
      }

      // If authenticated, allow through
      if (context.auth.user) {
        return;
      }

      // If not loading and no user, redirect to sign-in
      // This should rarely happen since AuthenticatedLayout handles it
      const redirectTo = buildRedirectTo(location);
      throw redirect({
        to: '/sign-in',
        search: redirectTo ? { redirectTo } : undefined,
      });
    }
    // If still loading, let the AuthenticatedLayout component handle the redirect
  },
});
