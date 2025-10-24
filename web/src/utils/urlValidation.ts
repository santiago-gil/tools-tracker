/**
 * URL validation utility to prevent XSS attacks via dangerous URL schemes
 */

/**
 * Validates and sanitizes URLs to prevent XSS attacks
 * Only allows http: and https: protocols
 * @param url - The URL to validate
 * @returns A safe URL or null if the URL is dangerous
 */
export function sanitizeUrl(url: string | undefined | null): string | null {
    if (!url || typeof url !== 'string') {
        return null;
    }

    const trimmedUrl = url.trim();
    if (trimmedUrl === '') {
        return null;
    }

    try {
        const parsedUrl = new URL(trimmedUrl);

        // Only allow http and https protocols
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            return parsedUrl.toString();
        }

        // Reject dangerous protocols
        return null;
    } catch {
        // If URL parsing fails, it's not a valid URL
        return null;
    }
}

/**
 * Checks if a URL is safe to use in href attributes
 * @param url - The URL to check
 * @returns true if the URL is safe, false otherwise
 */
export function isUrlSafe(url: string | undefined | null): boolean {
    return sanitizeUrl(url) !== null;
}

/**
 * Gets a safe URL for display, falling back to a placeholder if unsafe
 * @param url - The URL to validate
 * @param fallback - The fallback text to show if URL is unsafe
 * @returns A safe URL or the fallback text
 */
export function getSafeUrl(url: string | undefined | null, fallback: string = 'Invalid URL'): string {
    const safeUrl = sanitizeUrl(url);
    return safeUrl || fallback;
}
