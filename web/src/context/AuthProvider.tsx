import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../api/client';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getUserByUid } from '../api/users';
import type { User } from '../types';

interface AuthContextValue {
  fbUser: FirebaseUser | null; // raw Firebase auth user
  user: User | null; // Firestore user doc (role + perms)
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  fbUser: null,
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fb) => {
      setFbUser(fb);
      if (fb) {
        try {
          const fetched = await getUserByUid(fb.uid);
          setUser(fetched);
        } catch (err) {
          console.error('Failed to fetch Firestore user doc:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ fbUser, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
