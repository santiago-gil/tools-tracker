import slugify from 'slugify';
import { createRequiredStringField } from './validationUtils.js';

/**
 * Shared slug utilities for both frontend and backend
 * Contains core normalization logic used across the application
 */

/**
 * Normalizes a name for slug generation and comparison
 * @param name - The name to normalize
 * @returns Normalized name for comparison
 */
export function normalizeName(name: string): string {
    return slugify(name, {
        lower: true,
        strict: true, // Remove special characters
        trim: true
    });
}

/**
 * Parses a slug into its component parts
 * @param slug - The slug to parse (format: tool-name--version-name)
 * @returns Object with toolName and versionName, or null if invalid format
 */
export function parseSlug(slug: string): { toolName: string; versionName: string } | null {
    if (!slug || typeof slug !== 'string') {
        return null;
    }

    const parts = slug.split('--');
    if (parts.length !== 2) {
        return null; // Invalid slug format
    }

    const [toolName, versionName] = parts;
    if (!toolName || !versionName) {
        return null; // Empty components
    }

    return { toolName, versionName };
}

/**
 * Creates a slug from tool name and version name
 * 
 * @deprecated Use createValidatedSlug instead for better validation and consistency.
 * This function provides basic normalization but lacks comprehensive validation.
 * 
 * @param toolName - The tool name
 * @param versionName - The version name
 * @returns The generated slug
 * 
 * @example
 * ```typescript
 * // Basic usage (deprecated - prefer createValidatedSlug)
 * const slug = createSlug('Google Analytics', 'GA4');
 * // Returns: 'google-analytics--ga4'
 * ```
 */
export function createSlug(toolName: string, versionName: string): string {
    // Delegate to createValidatedSlug for consistency and better validation
    return createValidatedSlug(toolName, versionName);
}

/**
 * Creates a validated slug with input validation and normalization
 * 
 * This function validates inputs and creates URL-friendly slugs using normalizeName.
 * Since normalizeName (via slugify) already produces valid slugs, no additional
 * format validation is needed.
 * 
 * @param toolName - The tool name (1-100 characters)
 * @param versionName - The version name (1-100 characters)
 * @returns A URL-friendly slug in format: tool-name--version-name
 * @throws Error if validation fails (empty input, too long, etc.)
 * 
 * @example
 * ```typescript
 * // Valid usage
 * const slug = createValidatedSlug('Google Analytics', 'GA4');
 * // Returns: 'google-analytics--ga4'
 * ```
 */
export function createValidatedSlug(toolName: string, versionName: string): string {
    // Validate inputs first
    const validatedToolName = createRequiredStringField(1, 100, 'Tool name').parse(toolName);
    const validatedVersionName = createRequiredStringField(1, 100, 'Version name').parse(versionName);

    // Normalize names (slugify already ensures valid format)
    const toolSlug = normalizeName(validatedToolName);
    if (!toolSlug) {
        throw new Error(`The tool name "${validatedToolName}" contains no alphanumeric characters after normalization`);
    }

    const versionSlug = normalizeName(validatedVersionName);
    if (!versionSlug) {
        throw new Error(`The version name "${validatedVersionName}" contains no alphanumeric characters after normalization`);
    }

    // Combine and return (no need for additional validation - normalizeName already did it)
    return `${toolSlug}--${versionSlug}`;
}
