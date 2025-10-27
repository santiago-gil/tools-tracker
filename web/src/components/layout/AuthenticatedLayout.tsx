import { Header } from './Header';
import { Outlet } from '@tanstack/react-router';
import { useAuth } from '../../hooks/useAuth';

export function AuthenticatedLayout() {
  const { user, loading } = useAuth();

  // Note: The router's beforeLoad hook handles redirecting unauthenticated users to /sign-in
  // We still handle loading state here because beforeLoad allows the route when loading is true

  // Show loading state while authentication is in progress
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-gray-100/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col overflow-hidden min-w-[320px]">
      <Header />
      <main className="flex-1 py-8 overflow-auto">
        <div className="container-main">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
