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

/**
 * Constructs a URL-encoded redirect parameter from a location object
 * Used for preserving the intended destination during authentication redirects
 * @param location - The location object containing pathname and search
 * @returns A URL-encoded string of the full path including search params
 */
export function buildRedirectTo(location: { pathname: string; search: unknown }): string {
    // If we were passed an href as pathname (hack to preserve full path in parent routes),
    // extract just the pathname from it
    let pathname = location.pathname;

    // Check if pathname is actually a full URL (contains protocol)
    if (pathname.includes('://')) {
        try {
            const url = new URL(pathname);
            // Validate origin before extracting pathname to prevent open redirect attacks
            if (typeof window !== 'undefined' && url.origin === window.location.origin) {
                pathname = url.pathname;
            }
            // If origin doesn't match, leave pathname as-is (don't extract/replace)
        } catch {
            // If URL parsing fails, just use pathname as-is
        }
    }

    // Don't create redirectTo for sign-in page itself
    if (pathname === '/sign-in') {
        return '';
    }

    let searchString = '';

    // Properly serialize search params
    // Only process plain objects (not arrays, null, or other object types)
    if (
        location.search &&
        location.search !== null &&
        !Array.isArray(location.search) &&
        Object.prototype.toString.call(location.search) === '[object Object]'
    ) {
        // Convert search object to query string
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(location.search)) {
            // Skip redirectTo in search params to prevent recursion
            if (key === 'redirectTo') {
                continue;
            }
            if (value != null && value !== '') {
                params.append(key, String(value));
            }
        }
        const queryString = params.toString();
        if (queryString) {
            searchString = '?' + queryString;
        }
    } else if (typeof location.search === 'string') {
        searchString = location.search;
    }

    // Return empty string if pathname is sign-in, otherwise encode it
    const fullPath = pathname + searchString;
    return encodeURIComponent(fullPath);
}

/**
 * Validates and sanitizes redirect paths to prevent open redirect attacks
 * Ensures the destination is a relative path within the app
 * @param redirectPath - The redirect path to validate
 * @param fallback - The fallback path to use if validation fails
 * @returns A safe relative path or the fallback
 */
export function validateRedirectPath(
    redirectPath: string | undefined | null,
    fallback: string = '/tools',
): string {
    if (!redirectPath || typeof redirectPath !== 'string') {
        return fallback;
    }

    // Decode the URL-encoded path
    let decodedPath: string;
    try {
        decodedPath = decodeURIComponent(redirectPath);
    } catch {
        // If decoding fails, reject
        return fallback;
    }

    // Reject empty paths
    if (!decodedPath || decodedPath.trim() === '') {
        return fallback;
    }

    // Reject paths starting with '//' (protocol-relative URLs like //evil.com/)
    if (decodedPath.startsWith('//')) {
        return fallback;
    }

    // Reject paths with protocol schemes (http:, https:, javascript:, data:, etc.)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decodedPath)) {
        return fallback;
    }

    // Ensure it starts with a single '/' (relative to root)
    if (!decodedPath.startsWith('/')) {
        return fallback;
    }

    // Reject paths that redirect to sign-in to prevent loops
    if (decodedPath === '/sign-in' || decodedPath.startsWith('/sign-in?')) {
        return fallback;
    }

    // Reject paths containing newline or carriage return characters
    if (/\r|\n/.test(decodedPath)) {
        return fallback;
    }

    // Reject paths containing '@' followed by alphanumeric to prevent parsing as userinfo
    // This mitigates open-redirect attacks by preventing paths like "user@host" from being parsed
    // as URLs with userinfo components
    if (/@[a-zA-Z0-9]/.test(decodedPath)) {
        return fallback;
    }

    // Parse the path to ensure it doesn't resolve to an external URL
    try {
        // In browser context, we can check if the URL resolves to the same origin
        // For server-side, we'll just return the validated path
        if (typeof window !== 'undefined') {
            const fullUrl = new URL(decodedPath, window.location.origin);
            // If the origin doesn't match, it's an external URL
            if (fullUrl.origin !== window.location.origin) {
                return fallback;
            }
        }
    } catch {
        // If parsing fails, reject
        return fallback;
    }

    // Return the validated relative path
    return decodedPath;
}
