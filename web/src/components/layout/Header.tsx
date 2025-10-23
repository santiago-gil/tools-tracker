import { useAuth } from '../../contexts/AuthContext';
import { CrownLogo } from './CrownLogo';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <CrownLogo className="w-20 h-20 text-[var(--sk-gold)]" />
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-[var(--sk-red)]">SearchKings</span>{' '}
              <span className="text-[var(--sk-black)]">Tool Tracker</span>
            </h1>
            <p className="text-sm text-[var(--sk-grey)]">
              Integration & Capability Resource
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email}
                className="w-10 h-10 rounded-full border-2 border-[var(--sk-gold)]"
              />
            )}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                {user.displayName || user.email}
              </div>
              <div className="text-xs text-[var(--sk-grey)] capitalize">{user.role}</div>
            </div>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--sk-red)] hover:bg-[var(--sk-red-dark)] rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
