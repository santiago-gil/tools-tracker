import { useEffect, useState, type ReactNode } from 'react';
import {
  signInWithPopup,
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
          console.log('Redirect result found:', result.user?.email);
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
    console.log('AuthProvider: signInWithGoogle called');
    const provider = new GoogleAuthProvider();

    try {
      console.log('AuthProvider: Trying popup sign-in...');
      const result = await signInWithPopup(auth, provider);
      console.log('AuthProvider: Popup sign-in successful:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });
    } catch (error) {
      console.error('AuthProvider: Popup sign-in failed:', error);
      // Don't fall back to redirect for now, let's debug the popup issue first
      throw error;
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
