import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { ToolEdit } from '../components/tools/ToolEdit';

export const Route = createFileRoute('/_authenticated/tools/$category/$tool/edit')({
  component: ToolEdit,
  beforeLoad: ({ context }) => {
    // If still loading, let the parent route handle loading state
    if (context.auth.loading) {
      return;
    }

    // If not loading and no user, redirect to sign-in
    if (!context.auth.user) {
      throw redirect({ to: '/sign-in' });
    }

    // Block access if user lacks edit permission
    if (!context.auth.user.permissions?.edit) {
      throw redirect({ to: '/tools' });
    }
  },
  validateSearch: z.object({
    v: z.string().optional(), // version query param
  }),
});
