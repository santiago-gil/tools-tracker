import { useEffect, useState } from 'react';
import { Header } from './Header';
import { Outlet, useRouter } from '@tanstack/react-router';
import { useAuth } from '../../hooks/useAuth';

export function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Note: The router's beforeLoad hook handles redirecting unauthenticated users to /sign-in
  // We still handle loading state here because beforeLoad allows the route when loading is true

  // Actually redirect to sign-in if no user after loading completes
  useEffect(() => {
    if (!loading && !user) {
      const performRedirect = async () => {
        setIsRedirecting(true);
        setRedirectError(null);

        try {
          await router.navigate({ to: '/sign-in' });
          // If navigation succeeds, component will unmount
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Navigation failed';
          console.error('Failed to redirect to sign-in:', error);
          setRedirectError(errorMessage);
          setIsRedirecting(false);
        }
      };

      performRedirect();
    }
  }, [loading, user, router]);

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
          {redirectError ? (
            <>
              <div className="text-red-500 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Failed to Redirect
              </h3>
              <p className="text-secondary mb-6 max-w-md mx-auto">{redirectError}</p>
              <button
                onClick={async () => {
                  setRedirectError(null);
                  setIsRedirecting(true);
                  try {
                    await router.navigate({ to: '/sign-in' });
                    // If navigation succeeds, component will unmount
                  } catch (error) {
                    const errorMessage =
                      error instanceof Error ? error.message : 'Navigation failed';
                    console.error('Failed to redirect to sign-in:', error);
                    setRedirectError(errorMessage);
                    setIsRedirecting(false);
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
              <p className="text-sm text-secondary mt-4">
                Or{' '}
                <a href="/sign-in" className="text-primary underline">
                  click here
                </a>{' '}
                to go to sign-in
              </p>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-secondary">
                {isRedirecting ? 'Redirecting to sign-in...' : 'Redirecting...'}
              </p>
            </>
          )}
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
