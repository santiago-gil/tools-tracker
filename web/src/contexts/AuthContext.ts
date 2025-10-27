import { createContext } from 'react';
import type { User } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';

export interface AuthContextValue {
    firebaseUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    error: Error | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
