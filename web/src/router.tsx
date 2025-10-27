import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  useNavigate,
  Outlet,
} from '@tanstack/react-router';
import { ToolList } from './components/tools/ToolList';
import { UsersPage } from './components/users/UsersPage';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';
import { SignInPage } from './components/auth/SignInPage';
import { NotFoundPage } from './components/common/NotFoundPage';
import type { User } from './types';

// Error component for navigation errors
// eslint-disable-next-line react-refresh/only-export-components
const NavigationErrorComponent = ({ error }: { error: Error }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="form-width bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-primary mb-2">Navigation Error</h2>
          <p className="text-secondary mb-6">
            {error instanceof Error
              ? error.message
              : 'An unexpected navigation error occurred'}
          </p>
          <button onClick={() => navigate({ to: '/tools' })} className="btn-primary">
            Go to Tools
          </button>
        </div>
      </div>
    </div>
  );
};

// Register the router context type
declare module '@tanstack/react-router' {
  interface RouterContext {
    auth: {
      user: User | null;
      loading: boolean;
    };
  }
}

// Helper function to extract auth context from router context
const getAuthContext = (
  context: unknown,
): { auth: { user: User | null; loading: boolean } } => {
  return context as { auth: { user: User | null; loading: boolean } };
};

// Root route (no authentication check here)
const rootRoute = createRootRoute({
  component: () => {
    return <Outlet />;
  },
  errorComponent: NavigationErrorComponent,
  notFoundComponent: NotFoundPage,
});

// Authenticated layout route
const authenticatedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: AuthenticatedLayout,
  notFoundComponent: NotFoundPage,
  beforeLoad: ({ context }) => {
    const authContext = getAuthContext(context);

    // If still loading, show loading state instead of blocking
    if (authContext.auth.loading) {
      // Don't block the route, let the component handle loading state
      return;
    }

    // If not loading and no user, redirect to sign-in
    if (!authContext.auth.user) {
      throw redirect({ to: '/sign-in' });
    }
  },
});

// Index route (redirect to tools)
const indexRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/tools' });
  },
});

// Tools route
const toolsRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/tools',
  component: ToolList,
});

// Tools with specific tool slug route
const toolsWithSlugRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/tools/$toolSlug',
  component: ToolList,
});

// Users route
const usersRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: '/users',
  component: UsersPage,
});

// Sign-in route (no authentication required)
const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sign-in',
  component: SignInPage,
  beforeLoad: ({ context }) => {
    const authContext = getAuthContext(context);
    // If user is already authenticated, redirect to tools
    if (!authContext.auth.loading && authContext.auth.user) {
      throw redirect({ to: '/tools' });
    }
    // Allow unauthenticated users to access sign-in
  },
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  authenticatedLayoutRoute.addChildren([
    indexRoute,
    toolsRoute,
    toolsWithSlugRoute,
    usersRoute,
  ]),
  signInRoute,
]);

// Create the router with context
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    auth: {
      user: null,
      loading: true,
    },
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
