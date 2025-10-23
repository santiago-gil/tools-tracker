import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { SignInPage } from './components/auth/SignInPage';
import { Layout } from './components/layout/Layout';
import { ToolList } from './components/tools/ToolList';
import { UsersPage } from './components/users/UsersPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

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
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setCurrentPage('tools')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            currentPage === 'tools'
              ? 'text-[var(--sk-red)] border-primary-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Tools
        </button>
        {user.permissions?.manageUsers && (
          <button
            onClick={() => setCurrentPage('users')}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              currentPage === 'users'
                ? 'text-[var(--sk-red)] border-primary-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Users
          </button>
        )}
      </div>

      {/* Page Content */}
      {currentPage === 'tools' && <ToolList />}
      {currentPage === 'users' && user.permissions?.manageUsers && <UsersPage />}
    </Layout>
  );
}
