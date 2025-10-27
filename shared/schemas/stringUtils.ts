import slugify from 'slugify';

/**
 * String utilities for URL-friendly normalization
 * Used for creating URL segments and database lookup keys
 */

/**
 * Normalizes a string for URL segments and database comparison
 * Converts to lowercase, removes special characters, and ensures URL-safe format
 * 
 * @param str - The string to normalize
 * @returns Normalized string (e.g., "Chat Tools" → "chat-tools")
 * 
 * @example
 * ```typescript
 * normalizeName("Google Analytics"); // "google-analytics"
 * normalizeName("3rd Party Tools");  // "3rd-party-tools"
 * ```
 */
export function normalizeName(str: string): string {
    return slugify(str, {
        lower: true,
        strict: true, // Remove special characters
        trim: true
    });
}

