import { z } from 'zod';

/**
 * =========================
 * VALIDATION UTILITIES
 * =========================
 * 
 * Centralized validation helpers for strings, URLs, and other common patterns
 * 
 * EMPTY STRING HANDLING PATTERN:
 * - Empty strings ('') are transformed to undefined
 * - This ensures optional fields are truly optional
 * - Prevents empty string pollution in API responses
 * - Database-friendly: undefined is better than empty strings for optional fields
 */

/**
 * Sanitizes URLs to prevent XSS attacks
 * Only allows http: and https: protocols
 * @param url - The URL to sanitize
 * @returns A safe URL or null if the URL is dangerous
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
    const trimmed = (url ?? '').trim();

    if (trimmed === '') {
        return null;
    }

    try {
        const parsedUrl = new URL(trimmed);

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
 * Creates a Zod schema for safe URL validation
 * @param fieldName - The name of the field for error messages
 * @returns A Zod string schema with URL validation
 */
export function createUrlSchema(fieldName: string = 'URL') {
    return z.string()
        .optional()
        .transform(val => {
            if (!val) return undefined;
            const sanitized = sanitizeUrl(val);
            return sanitized === null ? undefined : sanitized;
        });
}

/**
 * =========================
 * STRING VALIDATION HELPERS
 * =========================
 */

/**
 * Helper function for required string fields with trim and length validation
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length
 * @param fieldName - Field name for error messages
 * @returns Zod string schema with validation
 */
export function createRequiredStringField(minLength: number = 1, maxLength: number, fieldName: string) {
    return z.string()
        .transform(val => val.trim())
        .pipe(z.string().min(minLength, `${fieldName} is required`).max(maxLength, `${fieldName} too long`));
}

/**
 * Helper function for optional string fields with trim and length validation
 * @param maxLength - Maximum length
 * @param fieldName - Field name for error messages
 * @returns Zod string schema with validation
 */
export function createOptionalStringField(maxLength: number, fieldName: string) {
    return z.preprocess(
        (v) => {
            if (typeof v === 'string') {
                const trimmed = v.trim();
                return trimmed === '' ? undefined : trimmed;
            }
            return v;
        },
        z.string().max(maxLength, `${fieldName} too long`).optional()
    );
}

/**
 * Helper function for required string fields without trim (for form validation)
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length
 * @param fieldName - Field name for error messages
 * @returns Zod string schema with validation
 */
export function createRequiredStringFieldNoTrim(minLength: number = 1, maxLength: number, fieldName: string) {
    return z.string()
        .min(minLength, `${fieldName} is required`)
        .max(maxLength, `${fieldName} too long`);
}

/**
 * Helper function for optional string fields without trim (for form validation)
 * @param maxLength - Maximum length
 * @param fieldName - Field name for error messages
 * @returns Zod string schema with validation
 */
export function createOptionalStringFieldNoTrim(maxLength: number, fieldName: string) {
    return z.string()
        .max(maxLength, `${fieldName} too long`)
        .optional();
}

/**
 * =========================
 * DATETIME VALIDATION HELPERS
 * =========================
 */

/**
 * Helper function for required datetime fields
 * @param fieldName - Field name for error messages
 * @returns Zod string schema with datetime validation
 */
export function createRequiredDateTimeField(fieldName: string) {
    return z.string().datetime(`${fieldName} must be a valid ISO 8601 datetime string`);
}

/**
 * Helper function for optional datetime fields
 * @param fieldName - Field name for error messages
 * @returns Zod string schema with datetime validation
 */
export function createOptionalDateTimeField(fieldName: string) {
    return z.string().datetime(`${fieldName} must be a valid ISO 8601 datetime string`).optional();
}
