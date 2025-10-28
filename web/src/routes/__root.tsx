import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { NotFoundPage } from '../components/common/NotFoundPage';
import type { User } from '../types';

// Error component for navigation errors
const NavigationErrorComponent = ({ error }: { error: unknown; reset: () => void }) => {
  // Safely extract error message, handling cases where error might not be a proper Error
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'string') {
      return err;
    }
    if (err && typeof err === 'object' && 'message' in err) {
      return String(err.message);
    }
    return 'An unknown error occurred';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="form-width bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-primary mb-2">Navigation Error</h2>
          <p className="text-secondary mb-6">{getErrorMessage(error)}</p>
        </div>
      </div>
    </div>
  );
};

// Define router context type for type-safe context usage
interface RouterContext {
  auth: {
    user: User | null;
    loading: boolean;
    error: Error | null;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: NavigationErrorComponent,
  notFoundComponent: NotFoundPage,
});
