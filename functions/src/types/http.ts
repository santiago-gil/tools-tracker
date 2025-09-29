// functions/src/types/http.ts
import type { Request } from 'express';

export interface RequestUser {
  uid: string;
  email?: string;
  role?: "admin" | "ops" | "viewer";
}

export interface AuthedRequest extends Request {
  user?: RequestUser;
}