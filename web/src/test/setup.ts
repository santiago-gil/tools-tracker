// Test setup file for vitest
// This file can be used to configure global test settings

// Mock window.performance if not available (for Node.js environment)
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  global.performance = {
    now: () => Date.now()
  } as any;
}
