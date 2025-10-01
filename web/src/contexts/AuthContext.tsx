import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithPopup,
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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper to retry fetching user data (for race condition with Cloud Function)
async function fetchUserWithRetry(
  uid: string,
  maxRetries = 5,
  delayMs = 500,
): Promise<User | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { user } = await usersApi.getCurrent(uid);
      return user;
    } catch (error: any) {
      // If 404, the document might not exist yet - retry
      if (error.status === 404 && attempt < maxRetries - 1) {
        console.log(
          `User document not found (attempt ${attempt + 1}/${maxRetries}), retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      // Other errors or max retries reached
      throw error;
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const firestoreUser = await fetchUserWithRetry(fbUser.uid);
          setUser(firestoreUser);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
