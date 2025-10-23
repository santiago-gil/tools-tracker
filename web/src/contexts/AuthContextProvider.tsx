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
import { auth } from '../lib/firebase.js';
import { usersApi } from '../lib/api.js';
import type { User } from '../types';
import { AuthContext } from './AuthContext.js';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const handleAuth = async () => {
      try {
        // Check for redirect result first
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in via redirect
        }
      } catch {
        // Silently handle redirect errors
      }

      // Set up auth state listener
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);

        if (fbUser) {
          try {
            const { user: firestoreUser } = await usersApi.getCurrent(fbUser.uid);
            // Merge Firebase Auth data with Firestore user data
            setUser({
              ...firestoreUser,
              displayName: fbUser.displayName || firestoreUser.displayName,
              photoURL: fbUser.photoURL || firestoreUser.photoURL,
            });
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }

        setLoading(false);
      });
    };

    handleAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
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
