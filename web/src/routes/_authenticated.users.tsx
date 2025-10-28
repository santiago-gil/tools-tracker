import { createFileRoute, redirect } from '@tanstack/react-router';
import { UsersPage } from '../components/users/UsersPage';
import { buildRedirectTo } from '../utils/urlValidation';

export const Route = createFileRoute('/_authenticated/users')({
  component: UsersPage,
  beforeLoad: ({ context, location }) => {
    // Wait for auth to complete before checking permissions
    if (context.auth.loading) {
      return;
    }

    // If not loading and no user, redirect to sign-in with intended destination
    if (!context.auth.user) {
      const redirectTo = buildRedirectTo(location);
      throw redirect({
        to: '/sign-in',
        search: redirectTo ? { redirectTo } : undefined,
      });
    }

    // Only users with manageUsers permission can access
    if (!context.auth.user.permissions?.manageUsers) {
      throw redirect({ to: '/tools' });
    }
  },
});
