import { useEffect, useState, type ReactNode } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { usersApi } from '../lib/api';
import type { User } from '../types';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'firebase:authUser') {
        // Another tab signed in/out, refresh auth state
        console.debug('Auth state changed in another tab, refreshing...');
        // Force a re-check of auth state
        const currentUser = auth.currentUser;
        if (currentUser !== firebaseUser) {
          setFirebaseUser(currentUser);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [firebaseUser]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let currentRequestId = 0;

    const handleAuth = async () => {
      try {
        // Check for redirect result first
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in via redirect
        }
      } catch (err) {
        // Log redirect errors for debugging while preserving non-throwing behavior
        console.debug(
          'getRedirectResult error:',
          err instanceof Error ? err.message : String(err),
          err instanceof Error ? err.stack : undefined,
        );
      }

      // Set up auth state listener
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);

        // Increment request ID to cancel stale requests
        const requestId = ++currentRequestId;

        if (fbUser) {
          try {
            const { user: firestoreUser } = await usersApi.getCurrent(fbUser.uid);

            // Only update if this is still the current request
            if (requestId === currentRequestId) {
              // Merge Firebase Auth data with Firestore user data
              setUser({
                ...firestoreUser,
                displayName: fbUser.displayName || firestoreUser.displayName,
                photoURL: fbUser.photoURL || firestoreUser.photoURL,
              });
            }
          } catch (error) {
            // Only handle error if this is still the current request
            if (requestId === currentRequestId) {
              const statusCode =
                error && typeof error === 'object' && 'status' in error
                  ? error.status
                  : null;
              console.error('Failed to fetch user data:', { error, statusCode });

              // If user document doesn't exist (404), it will be created by the backend trigger
              // For other errors, we should sign out to prevent showing stale data
              if (statusCode !== 404) {
                // Sign out on auth errors or other failures
                setFirebaseUser(null);
                setUser(null);
              } else {
                // Just clear user state for 404 - backend will create it
                setUser(null);
              }
            }
          }
        } else {
          // Only update if this is still the current request
          if (requestId === currentRequestId) {
            setUser(null);
          }
        }

        // Always set loading to false for the current request
        if (requestId === currentRequestId) {
          setLoading(false);
        }
      });
    };

    handleAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Cancel any pending requests
      currentRequestId = -1;
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        if (
          firebaseError.code === 'auth/cancelled-popup-request' ||
          firebaseError.code === 'auth/popup-blocked'
        ) {
          // Fall back to redirect flow
          await signInWithRedirect(auth, provider);
        } else {
          // For other errors, just throw them
          throw error;
        }
      } else {
        // For other errors, just throw them
        throw error;
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, user, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
