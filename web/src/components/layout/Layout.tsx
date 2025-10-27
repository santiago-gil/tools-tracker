import { Header } from './Header';
import { Outlet } from '@tanstack/react-router';

export type Page = 'tools' | 'users';

export function Layout() {
  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-gray-100/30 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col overflow-hidden min-w-[320px]">
      <Header />
      <main className="flex-1 py-8 overflow-auto">
        <div className="container-main">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
