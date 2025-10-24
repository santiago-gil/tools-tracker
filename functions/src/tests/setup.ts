/**
 * Test setup file for vitest
 */

import { beforeAll, afterAll } from 'vitest';

// Mock Firebase Admin SDK for testing
const mockFirebaseAdmin = {
  auth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user-123',
      email: 'test@searchkings.ca',
      name: 'Test User'
    })
  }),
  firestore: () => ({
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            uid: 'test-user-123',
            email: 'test@searchkings.ca',
            role: 'admin',
            permissions: {
              add: true,
              edit: true,
              delete: true,
              manageUsers: true
            }
          })
        }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined)
      })
    })
  })
};

// Mock the Firebase Admin SDK
vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  auth: mockFirebaseAdmin.auth,
  firestore: mockFirebaseAdmin.firestore
}));

beforeAll(() => {
  console.log('🧪 Test environment setup complete');
});

afterAll(() => {
  console.log('🧹 Test cleanup complete');
});
