import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { SignInPage } from '../components/auth/SignInPage';
import { validateRedirectPath } from '../utils/urlValidation';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
  validateSearch: z.object({
    redirectTo: z.string().optional(),
  }),
  beforeLoad: ({ context, search }) => {
    // If user is already authenticated, redirect to intended destination or tools
    if (!context.auth?.loading && context.auth?.user) {
      // Only redirect if we have a meaningful redirect destination
      if (search.redirectTo) {
        const destination = validateRedirectPath(search.redirectTo);
        // Only redirect if we have a valid destination (not empty and not sign-in)
        if (destination && destination !== '/sign-in') {
          throw redirect({
            to: destination,
            search: {}, // Explicitly pass empty search to avoid params issues
          });
        }
      }
      // If no redirectTo parameter or invalid destination, redirect to tools
      throw redirect({
        to: '/tools',
        search: {},
      });
    }
  },
});
