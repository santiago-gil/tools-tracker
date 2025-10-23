import { createContext } from 'react';
import type { AuthContextValue } from '../types/Auth.js';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
