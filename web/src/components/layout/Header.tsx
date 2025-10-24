import { useAuth } from '../../hooks/useAuth';
import { CrownLogo } from './CrownLogo';
import { DarkModeToggle } from '../common/DarkModeToggle';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header
      className="elevation-1 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-b transition-colors duration-200"
      style={{ borderColor: 'var(--border-light)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <CrownLogo className="w-20 h-20 text-[var(--sk-gold)]" />
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-[var(--sk-red)]">SearchKings</span>{' '}
              <span className="text-[var(--sk-black)] dark:text-white">Tool Tracker</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
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
              <div
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {user.displayName || user.email}
              </div>
              <div
                className="text-xs capitalize"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {user.role}
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-sm transition-colors duration-200 hover:underline"
              style={{
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--text-secondary)')
              }
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
