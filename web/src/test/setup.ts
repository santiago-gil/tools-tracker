// Test setup file for vitest
// This file can be used to configure global test settings

// Mock window.performance if not available (for Node.js environment)
if (typeof window === 'undefined') {
  const g = globalThis as typeof globalThis & { performance?: Performance & { now: () => number } };
  if (!g.performance) {
    g.performance = {
      now: () => Date.now()
    } as Performance;
  }
}
