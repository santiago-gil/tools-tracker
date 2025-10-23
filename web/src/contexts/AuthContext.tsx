import { createContext, useEffect, useState, type ReactNode } from 'react';
import {
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

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
          console.log('Redirect result:', result);
        }
      } catch (error) {
        console.error('Error getting redirect result:', error);
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
          } catch (error) {
            console.error('Failed to fetch user data:', error);
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
    await signInWithRedirect(auth, provider);
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
