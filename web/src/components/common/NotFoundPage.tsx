import { useNavigate, useRouter, useCanGoBack } from '@tanstack/react-router';
import { CrownLogo } from '../layout/CrownLogo';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const handleGoBack = () => {
    // Use TanStack Router's history to ensure navigation goes through router
    if (canGoBack) {
      router.history.back();
    } else {
      // Fall back to home if there's no history
      navigate({ to: '/tools' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <CrownLogo className="w-20 h-20 text-[var(--sk-gold)]" />
        </div>

        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-primary mb-2">Page Not Found</h2>
        <p className="text-secondary mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate({ to: '/tools' })}
            className="btn-primary flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>

          <button
            onClick={handleGoBack}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
