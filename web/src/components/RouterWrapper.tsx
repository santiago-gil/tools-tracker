import { RouterProvider } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { router } from '../router';

export function RouterWrapper() {
  const { user, loading, error } = useAuth();

  const context = useMemo(
    () => ({
      auth: {
        user,
        loading,
        error,
      },
    }),
    [user, loading, error],
  );

  return <RouterProvider router={router} context={context} />;
}
