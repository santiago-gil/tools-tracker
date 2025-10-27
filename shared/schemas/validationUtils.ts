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
 * @param url - string | null | undefined - The URL to sanitize. Nullish inputs are treated as empty strings.
 * @returns A sanitized string or null when input is nullish or whitespace-only
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
 * @returns A Zod string schema with URL validation
 */
export function createUrlSchema() {
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
        (v) => {
            if (typeof v === 'string') {
                const trimmed = v.trim();
                return trimmed === '' ? undefined : trimmed;
            }
            return v;
        },
        stringSchema.optional()
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

/**
 * =========================
 * SLUG VALIDATION HELPERS
 * =========================
 */

/**
 * Creates a reusable slug validator factory
 * Enforces the same validation rules as SLUG_SCHEMA with configurable length constraints.
 * This is intended for full slugs with double-hyphen separators (e.g., "tool-name--version-name").
 * @param min - Minimum length (default: 3)
 * @param max - Maximum length (default: 200)
 * @returns Zod schema for slug validation
 */
export function createSlugField(min: number = 3, max: number = 200) {
    return z.string()
        .min(min, 'Slug too short')
        .max(max, 'Slug too long')
        .regex(/^[a-z0-9-]+$/, 'Slug contains invalid characters')
        .refine((val: string) => !val.startsWith('-') && !val.endsWith('-'), 'Slug cannot start or end with hyphen')
        .refine((val: string) => {
            // Allow exactly one double hyphen separator (--), but no other consecutive hyphens
            const doubleHyphenCount = (val.match(/--/g) || []).length;
            if (doubleHyphenCount > 1) return false; // More than one double hyphen
            if (doubleHyphenCount === 1) {
                // If there's exactly one double hyphen, ensure neither part starts or ends with a single hyphen
                const parts = val.split('--');
                return !parts[0].startsWith('-') && !parts[0].endsWith('-') &&
                    !parts[1].startsWith('-') && !parts[1].endsWith('-');
            }
            // No double hyphens - valid
            return true;
        }, 'Slug may contain at most one double hyphen (--) used as a separator; no other consecutive hyphens allowed and no leading/trailing hyphens on either side');
}

/**
 * Shared Zod schema for slug validation
 * Used for URL-friendly slugs with consistent validation rules
 * Includes validation for double-hyphen separator pattern (tool-name--version-name)
 */
export const SLUG_SCHEMA = z.string()
    .min(3, 'Slug too short')
    .max(200, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug contains invalid characters')
    .refine((val: string) => !val.startsWith('-') && !val.endsWith('-'), 'Slug cannot start or end with hyphen')
    .refine((val: string) => {
        // Allow exactly one double hyphen separator (--), but no other consecutive hyphens
        const doubleHyphenCount = (val.match(/--/g) || []).length;
        if (doubleHyphenCount > 1) return false; // More than one double hyphen
        if (doubleHyphenCount === 1) {
            // If there's exactly one double hyphen, ensure neither part starts or ends with a single hyphen
            const parts = val.split('--');
            return !parts[0].startsWith('-') && !parts[0].endsWith('-') &&
                !parts[1].startsWith('-') && !parts[1].endsWith('-');
        }
        // No double hyphens - valid
        return true;
    }, 'Slug may contain at most one double hyphen (--) used as a separator; no other consecutive hyphens allowed and no leading/trailing hyphens on either side');

/**
 * =========================
 * DATETIME VALIDATION HELPERS
 * =========================
 */

/**
 * Helper function for required datetime fields
 * @param _fieldName - Field name for documentation (currently unused but kept for API consistency)
 * @returns Zod string schema with datetime validation
 * 
 * Validates ISO 8601 datetime strings with timezone offsets.
 * Accepts formats like: "2024-01-01T12:00:00.000Z", "2024-01-01T12:00:00+02:00"
 */
export function createRequiredDateTimeField(_fieldName: string) {
    return z.iso.datetime({ offset: true });
}

/**
 * Helper function for optional datetime fields
 * @param _fieldName - Field name for documentation (currently unused but kept for API consistency)
 * @returns Zod string schema with datetime validation
 * 
 * Validates ISO 8601 datetime strings with timezone offsets, or undefined.
 * Accepts formats like: "2024-01-01T12:00:00.000Z", "2024-01-01T12:00:00+02:00"
 */
export function createOptionalDateTimeField(_fieldName: string) {
    return z.iso.datetime({ offset: true }).optional();
}
