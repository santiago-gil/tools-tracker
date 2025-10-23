import { useAuth } from '../../hooks/useAuth';
import { CrownLogo } from './CrownLogo';
import { DarkModeToggle } from '../common/DarkModeToggle';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <CrownLogo className="w-20 h-20 text-[var(--sk-gold)]" />
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-[var(--sk-red)]">SearchKings</span>{' '}
              <span className="text-[var(--sk-black)] dark:text-white">Tool Tracker</span>
            </h1>
            <p className="text-sm text-[var(--sk-grey)]">
              Integration & Capability Resource
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email}
                className="w-10 h-10 rounded-full border-2 border-[var(--sk-gold)]"
              />
            )}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user.displayName || user.email}
              </div>
              <div className="text-xs text-[var(--sk-grey)] capitalize">{user.role}</div>
            </div>
            <button onClick={signOut} className="btn-primary text-sm">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
