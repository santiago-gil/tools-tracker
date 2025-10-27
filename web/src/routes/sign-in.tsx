import { createFileRoute, redirect } from '@tanstack/react-router';
import { SignInPage } from '../components/auth/SignInPage';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
  beforeLoad: ({ context }) => {
    // If user is already authenticated, redirect to tools
    if (!context.auth?.loading && context.auth?.user) {
      throw redirect({ to: '/tools' });
    }
  },
});
