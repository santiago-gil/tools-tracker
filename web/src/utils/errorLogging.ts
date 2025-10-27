/**
 * Error logging utility
 * In production, this would forward errors to a logging service.
 * In development, it logs to console.
 */

export function logError(error: unknown, context?: Record<string, unknown>): void {
    const errorDetails = {
        error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
        } : error,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
    };

    // In production, forward to a logging service (e.g., Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
        // TODO: Replace with actual logging service integration
        // Example: Sentry.captureException(error, { extra: errorDetails });
        console.error('[Production Error]', errorDetails);
    } else {
        // In development, log to console
        console.error('[Development Error]', errorDetails);
    }
}

