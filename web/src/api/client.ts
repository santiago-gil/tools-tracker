import { initializeApp } from "firebase/app";
import {
    getAuth,
    signOut,
} from "firebase/auth";
import { ApiError, type ApiErrorResponse } from "../types/api";
import { connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

if (import.meta.env.DEV) {
    // Optionally connect emulators
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await auth.currentUser?.getIdToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api${path}`, { ...options, headers });

    if (!res.ok) {
        // Attempt to parse structured error
        let payload: ApiErrorResponse | null = null;
        try {
            payload = await res.json();
        } catch {
            // ignore, payload stays null
        }

        const message = payload?.error || res.statusText;
        const details = payload?.errors;

        if (res.status === 401) {
            await signOut(auth);
            window.location.href = "/login";
        }

        throw new ApiError(res.status, message, details);
    }

    return res.json();
}