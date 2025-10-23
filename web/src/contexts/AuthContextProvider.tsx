import { useEffect, useState, type ReactNode } from 'react';
import {
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
            console.error('Error details:', {
              uid: fbUser.uid,
              email: fbUser.email,
              error: error instanceof Error ? error.message : error,
            });

            // If it's a 404 error, the user document doesn't exist yet
            // The backend should create it automatically, so let's retry after a short delay
            if (error instanceof Error && error.message.includes('404')) {
              console.log('User document not found, retrying in 2 seconds...');
              setTimeout(async () => {
                try {
                  const { user: firestoreUser } = await usersApi.getCurrent(fbUser.uid);
                  setUser({
                    ...firestoreUser,
                    displayName: fbUser.displayName || firestoreUser.displayName,
                    photoURL: fbUser.photoURL || firestoreUser.photoURL,
                  });
                } catch (retryError) {
                  console.error('Retry failed:', retryError);
                  setUser(null);
                }
              }, 2000);
            } else {
              setUser(null);
            }
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
