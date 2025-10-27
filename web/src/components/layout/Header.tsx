import { useState, useRef, useEffect, forwardRef } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter, useLocation } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { CrownLogo } from './CrownLogo';
import { DarkModeToggle } from '../common/DarkModeToggle';

interface NavigationButtonProps {
  label: string;
  targetPage: 'tools' | 'users';
  currentPage: 'tools' | 'users';
  onPageChange: (page: 'tools' | 'users') => Promise<void>;
  onSelect?: () => void;
  className?: string;
}

const NavigationButton = forwardRef<HTMLButtonElement, NavigationButtonProps>(
  ({ label, targetPage, currentPage, onPageChange, onSelect, className = '' }, ref) => {
    const isActive = currentPage === targetPage;

    const handleClick = async () => {
      try {
        await onPageChange(targetPage);
        onSelect?.();
      } catch {
        // Navigation failed, don't call onSelect to keep menu open
        // Error is already handled in navigateToPage with toast notification
      }
    };

    const baseClasses = `px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
      isActive
        ? 'text-[var(--sk-red)] bg-red-50 dark:bg-red-900/20'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

    return (
      <button
        ref={ref}
        onClick={handleClick}
        className={`${baseClasses} ${className}`}
        aria-current={isActive ? 'page' : undefined}
        aria-label={`Navigate to ${label} page`}
      >
        {label}
      </button>
    );
  },
);

NavigationButton.displayName = 'NavigationButton';

export function Header() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = useLocation({ select: (l) => l.pathname });

  const handleSignOut = async () => {
    try {
      await signOut();
      await router.navigate({ to: '/sign-in' });
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out. Please try again.');
      // Don't navigate to sign-in page on error
    }
  };

  // Refs for keyboard accessibility
  const menuToggleButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const isMountedRef = useRef(false);

  // Determine current page based on pathname
  const currentPage = pathname.startsWith('/tools')
    ? 'tools'
    : pathname.startsWith('/users')
    ? 'users'
    : 'tools';

  const navigateToPage = async (page: 'tools' | 'users') => {
    try {
      await router.navigate({ to: `/${page}` });
    } catch (error) {
      console.error('Navigation failed:', error);
      toast.error(`Failed to navigate to ${page} page. Please try again.`);
      // Re-throw the error so caller can detect failure and keep menu open
      throw error;
    }
  };

  // Handle keyboard accessibility
  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsMobileMenuOpen(false);
    }
  };

  // Focus management when mobile menu opens/closes
  useEffect(() => {
    // Skip the initial mount to avoid focusing on mount
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    if (isMobileMenuOpen) {
      // Focus the first menu item when menu opens
      firstMenuItemRef.current?.focus();
    } else {
      // Return focus to toggle button when menu closes
      menuToggleButtonRef.current?.focus();
    }
  }, [isMobileMenuOpen]);

  return (
    <header
      className="elevation-1 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-b transition-colors duration-200"
      style={{ borderColor: 'var(--border-light)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between min-w-0">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <CrownLogo className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-[var(--sk-gold)] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
              <span className="text-[var(--sk-red)]">SearchKings</span>{' '}
              <span className="text-[var(--sk-black)] dark:text-white">Tool Tracker</span>
            </h1>
            <p
              className="text-xs sm:text-sm hidden sm:block"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Integration & Capability Resource
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        {user && (
          <nav
            className="hidden sm:flex items-center gap-4 mx-6"
            role="navigation"
            aria-label="Main navigation"
          >
            <NavigationButton
              label="Tools"
              targetPage="tools"
              currentPage={currentPage}
              onPageChange={navigateToPage}
            />
            {user.permissions?.manageUsers && (
              <NavigationButton
                label="Users"
                targetPage="users"
                currentPage={currentPage}
                onPageChange={navigateToPage}
              />
            )}
          </nav>
        )}

        {/* Mobile Navigation */}
        {user && (
          <div className="sm:hidden flex items-center">
            <button
              ref={menuToggleButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <DarkModeToggle />
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[var(--sk-gold)]"
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
              onClick={handleSignOut}
              className="text-xs sm:text-sm transition-colors duration-200 hover:underline whitespace-nowrap"
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

      {/* Mobile Navigation Dropdown */}
      {user && isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="sm:hidden border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
          style={{ borderColor: 'var(--border-light)' }}
          onKeyDown={handleMobileMenuKeyDown}
        >
          <nav
            className="px-4 py-2 space-y-1"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <NavigationButton
              ref={firstMenuItemRef}
              label="Tools"
              targetPage="tools"
              currentPage={currentPage}
              onPageChange={navigateToPage}
              onSelect={() => setIsMobileMenuOpen(false)}
              className="w-full text-left"
            />
            {user.permissions?.manageUsers && (
              <NavigationButton
                label="Users"
                targetPage="users"
                currentPage={currentPage}
                onPageChange={navigateToPage}
                onSelect={() => setIsMobileMenuOpen(false)}
                className="w-full text-left"
              />
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
