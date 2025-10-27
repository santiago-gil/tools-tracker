import { createFileRoute, redirect } from '@tanstack/react-router';
import { UsersPage } from '../components/users/UsersPage';

export const Route = createFileRoute('/_authenticated/users')({
  component: UsersPage,
  beforeLoad: ({ context }) => {
    // Wait for auth to complete before checking permissions
    if (context.auth.loading) {
      return;
    }

    // If not loading and no user, redirect to sign-in
    if (!context.auth.user) {
      throw redirect({ to: '/sign-in' });
    }

    // Only users with manageUsers permission can access
    if (!context.auth.user.permissions?.manageUsers) {
      throw redirect({ to: '/tools' });
    }
  },
});
