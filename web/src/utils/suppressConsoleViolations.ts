/**
 * Suppress browser performance violation warnings in production
 * These are Chrome DevTools warnings about slow handlers, forced reflows, etc.
 * They're useful in development but noisy in production.
 */

if (import.meta.env.PROD) {
    const originalWarn = console.warn;
    const violationPatterns = [
        /\(Violation\) 'setTimeout' handler took \d+ms/i,
        /\(Violation\) Forced reflow while executing JavaScript took \d+ms/i,
        /\(Violation\) 'click' handler took \d+ms/i,
        /\(Violation\) .* handler took \d+ms/i,
        /\(Violation\) Forced reflow/i,
    ];

    console.warn = function (...args: unknown[]) {
        const message = args[0] as string;
        // Check if this is a violation warning
        if (typeof message === 'string' && violationPatterns.some((pattern) => pattern.test(message))) {
            // Suppress the violation warning in production
            return;
        }
        // Pass through all other warnings
        originalWarn.apply(console, args);
    };
}

