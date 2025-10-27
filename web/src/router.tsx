import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Create the router - context will be provided by RouterProvider in App.tsx
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    auth: undefined!, // Will be set by RouterProvider in a React component
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
