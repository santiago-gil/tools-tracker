import { useState, Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth';
import { SignInPage } from './components/auth/SignInPage';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Lazy load components for better performance
const ToolList = lazy(() =>
  import('./components/tools/ToolList').then((module) => ({ default: module.ToolList })),
);
const UsersPage = lazy(() =>
  import('./components/users/UsersPage').then((module) => ({
    default: module.UsersPage,
  })),
);

type Page = 'tools' | 'users';

export function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('tools');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <SignInPage />;
  }

  return (
    <Layout>
      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setCurrentPage('tools')}
          className={`px-4 py-2 font-medium transition-all duration-200 ${
            currentPage === 'tools'
              ? 'text-[var(--sk-red)] border-b-2 border-[var(--sk-red)]'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          Tools
        </button>
        {user.permissions?.manageUsers && (
          <button
            onClick={() => setCurrentPage('users')}
            className={`px-4 py-2 font-medium transition-all duration-200 ${
              currentPage === 'users'
                ? 'text-[var(--sk-red)] border-b-2 border-[var(--sk-red)]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Users
          </button>
        )}
      </div>

      {/* Page Content */}
      <Suspense fallback={<LoadingSpinner />}>
        {currentPage === 'tools' && <ToolList />}
        {currentPage === 'users' && user.permissions?.manageUsers && <UsersPage />}
      </Suspense>
    </Layout>
  );
}
