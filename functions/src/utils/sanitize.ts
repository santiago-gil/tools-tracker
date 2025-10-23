/**
 * Backend sanitization utilities for security
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize text input (remove control characters, limit length)
 */
export function sanitizeText(input: string, maxLength = 1000): string {
    if (typeof input !== 'string') return '';

    return input
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .slice(0, maxLength);
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string | null {
    if (!url || typeof url !== 'string') return null;

    const trimmed = url.trim();
    if (!trimmed) return null;

    try {
        // Add protocol if missing
        const urlWithProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        const urlObj = new URL(urlWithProtocol);

        // Only allow http and https
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return null;
        }

        return urlObj.toString();
    } catch {
        return null;
    }
}

/**
 * Sanitize tool data before saving to database
 */
export function sanitizeToolData(data: any) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    // Sanitize basic text fields
    if (sanitized.name) {
        sanitized.name = sanitizeText(sanitized.name, 200);
    }

    if (sanitized.category) {
        sanitized.category = sanitizeText(sanitized.category, 100);
    }

    // Sanitize versions array
    if (Array.isArray(sanitized.versions)) {
        sanitized.versions = sanitized.versions.map((version: any) => {
            if (!version || typeof version !== 'object') return version;

            const sanitizedVersion = { ...version };

            // Sanitize version name
            if (sanitizedVersion.versionName) {
                sanitizedVersion.versionName = sanitizeText(sanitizedVersion.versionName, 100);
            }

            // Sanitize team considerations
            if (sanitizedVersion.team_considerations) {
                sanitizedVersion.team_considerations = sanitizeText(sanitizedVersion.team_considerations, 2000);
            }

            // Sanitize trackables
            if (sanitizedVersion.trackables && typeof sanitizedVersion.trackables === 'object') {
                sanitizedVersion.trackables = Object.fromEntries(
                    Object.entries(sanitizedVersion.trackables).map(([key, trackable]: [string, any]) => {
                        if (!trackable || typeof trackable !== 'object') return [key, trackable];

                        const sanitizedTrackable = { ...trackable };

                        // Sanitize notes
                        if (sanitizedTrackable.notes) {
                            sanitizedTrackable.notes = sanitizeText(sanitizedTrackable.notes, 1000);
                        }

                        // Sanitize URLs
                        if (sanitizedTrackable.example_site) {
                            sanitizedTrackable.example_site = sanitizeUrl(sanitizedTrackable.example_site);
                        }

                        if (sanitizedTrackable.documentation) {
                            sanitizedTrackable.documentation = sanitizeUrl(sanitizedTrackable.documentation);
                        }

                        // Remove empty values
                        if (!sanitizedTrackable.example_site) {
                            delete sanitizedTrackable.example_site;
                        }
                        if (!sanitizedTrackable.documentation) {
                            delete sanitizedTrackable.documentation;
                        }
                        if (!sanitizedTrackable.notes) {
                            delete sanitizedTrackable.notes;
                        }

                        return [key, sanitizedTrackable];
                    })
                );
            }

            return sanitizedVersion;
        });
    }

    return sanitized;
}

/**
 * Sanitize user data
 */
export function sanitizeUserData(data: any) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    if (sanitized.email) {
        sanitized.email = sanitizeText(sanitized.email, 100).toLowerCase();
    }

    if (sanitized.name) {
        sanitized.name = sanitizeText(sanitized.name, 100);
    }

    return sanitized;
}
