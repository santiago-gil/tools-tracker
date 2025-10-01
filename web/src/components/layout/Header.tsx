import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">👑</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tool Tracker</h1>
            <p className="text-sm text-gray-500">
              Resource for tracking integrations and capabilities
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user.email}</div>
              <div className="text-xs text-gray-500 capitalize">{user.role}</div>
            </div>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
