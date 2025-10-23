import type { User } from './index';
import type { User as FirebaseUser } from 'firebase/auth';

export interface AuthContextValue {
    firebaseUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}
