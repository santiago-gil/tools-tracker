import { useAuth } from '../../hooks/useAuth';
import { CrownLogo } from '../layout/CrownLogo';
import { DarkModeToggle } from '../common/DarkModeToggle';

export function SignInPage() {
  const { signInWithGoogle, loading } = useAuth();

  // Note: The router's beforeLoad hook handles redirecting authenticated users to /tools
  // This component only renders if user is not authenticated

  return (
    <div className="min-h-screen bg-[var(--badge-unknown-bg)] dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="form-width">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-10 relative">
          {/* Dark mode toggle in top right */}
          <div className="absolute top-5 right-5">
            <DarkModeToggle />
          </div>

          {/* Header */}
          <div className="text-center mb-8 flex flex-col items-center">
            <CrownLogo className="w-28 h-28 text-[var(--sk-gold)] mb-4" />
            <h1 className="text-3xl font-semibold text-primary mb-3">
              <span className="text-[var(--sk-red)]">SearchKings</span> Tool Tracker
            </h1>
            <p className="text-sm text-secondary leading-relaxed">
              Sign in to manage integrations and tools
            </p>
          </div>

          {/* Google Sign in Button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="btn-google-glass w-full flex items-center justify-center gap-3 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
