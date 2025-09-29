import { ApiError } from "../types/api";

/**
 * Normalize any error into { message, details }
 * details is always a string (safe for rendering in React)
 */
export function formatApiError(
    err: unknown
): { message: string; details: string | null } {
    if (!err) {
        return { message: "Unknown error", details: null };
    }

    // Already our ApiError class
    if (err instanceof ApiError) {
        return {
            message: err.message,
            details: stringify(err.details),
        };
    }

    // Plain Error object
    if (err instanceof Error) {
        return {
            message: err.message,
            details: null,
        };
    }

    // Fallback: string or something else
    if (typeof err === "string") {
        return { message: err, details: null };
    }

    return {
        message: "Unexpected error",
        details: stringify(err),
    };
}

/**
 * Stringify unknown value into safe JSON string
 */
function stringify(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === "string") return value;
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}