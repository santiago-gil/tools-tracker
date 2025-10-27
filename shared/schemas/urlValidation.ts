import { z } from 'zod';

/**
 * =========================
 * VALIDATION UTILITIES
 * =========================
 * 
 * Centralized validation helpers for strings, URLs, and other common patterns
 */

/**
 * Sanitizes URLs to prevent XSS attacks
 * Only allows http: and https: protocols
 * @param url - The URL to sanitize
 * @returns A safe URL or null if the URL is dangerous
 */
export function sanitizeUrl(url: string): string | null {
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
 * Creates a Zod schema for safe URL validation
 * @param fieldName - The name of the field for error messages
 * @returns A Zod string schema with URL validation
 */
export function createUrlSchema(fieldName: string = 'URL') {
    return z.preprocess(
        (val) => {
            if (!val || val === '') return undefined;
            const sanitized = sanitizeUrl(val as string);
            return sanitized === null ? undefined : sanitized;
        },
        z.string('Invalid or unsafe URL format')
    );
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
    let innerSchema = z.string().min(minLength, `${fieldName} is required`);
    if (typeof maxLength === 'number') {
        innerSchema = innerSchema.max(maxLength, `${fieldName} too long`);
    }
    return z.string()
        .transform(val => val.trim())
        .pipe(innerSchema);
}

/**
 * Helper function for optional string fields with trim and length validation
 * @param maxLength - Maximum length
 * @param fieldName - Field name for error messages
 * @returns Zod string schema with validation
 */
export function createOptionalStringField(maxLength: number, fieldName: string) {
    let stringSchema = z.string();
    if (typeof maxLength === 'number') {
        stringSchema = stringSchema.max(maxLength, `${fieldName} too long`);
    }
    return z.preprocess(
        (v) => typeof v === 'string' ? v.trim() : v,
        stringSchema.optional()
    ).transform(val => val === '' ? undefined : val);
}

/**
 * Helper function for required string fields without trim (for form validation)
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length
 * @param fieldName - Field name for error messages
 * @returns Zod string schema with validation
 */
export function createRequiredStringFieldNoTrim(minLength: number = 1, maxLength: number, fieldName: string) {
    let schema = z.string()
        .min(minLength, `${fieldName} is required`);
    if (typeof maxLength === 'number') {
        schema = schema.max(maxLength, `${fieldName} too long`);
    }
    return schema;
}

/**
 * Helper function for optional string fields without trim (for form validation)
 * @param maxLength - Maximum length
 * @param fieldName - Field name for error messages
 * @returns Zod string schema with validation
 */
export function createOptionalStringFieldNoTrim(maxLength: number, fieldName: string) {
    let schema = z.string();
    if (typeof maxLength === 'number') {
        schema = schema.max(maxLength, `${fieldName} too long`);
    }
    return schema.optional();
}
