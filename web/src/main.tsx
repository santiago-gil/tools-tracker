import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContextProvider';
import { RouterWrapper } from './components/RouterWrapper';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes - reduced for better concurrent editing
      gcTime: 1000 * 60 * 10, // 10 minutes - keep data in cache longer (v5: gcTime replaces cacheTime)
      retry: 1,
      refetchOnWindowFocus: true, // Refetch when user returns to tab to see concurrent changes
      refetchOnMount: true, // Refetch stale data on mount to surface concurrent edits from other users
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterWrapper />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
