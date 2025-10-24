/**
 * Sanitizes a string to be used as an HTML id attribute
 * HTML ids must:
 * - Start with a letter (a-z, A-Z)
 * - Contain only letters, digits, hyphens, and underscores
 * - Be unique within the document
 * 
 * @param id - The string to sanitize
 * @returns A valid HTML id or null if the input is invalid
 */
export function sanitizeHtmlId(id: string | undefined | null): string | null {
    if (!id || typeof id !== 'string') {
        return null;
    }

    // Remove any whitespace and convert to lowercase for consistency
    const trimmed = id.trim().toLowerCase();

    if (trimmed.length === 0) {
        return null;
    }

    // Replace invalid characters with hyphens
    // Keep only letters, digits, hyphens, and underscores
    let sanitized = trimmed.replace(/[^a-z0-9\-_]/g, '-');

    // Ensure it starts with a letter
    if (!/^[a-z]/.test(sanitized)) {
        sanitized = 'id-' + sanitized;
    }

    // Remove consecutive hyphens
    sanitized = sanitized.replace(/-+/g, '-');

    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');

    // Ensure it's not empty after sanitization
    if (sanitized.length === 0) {
        return null;
    }

    return sanitized;
}

/**
 * Creates a safe HTML id by combining multiple parts
 * @param parts - Array of strings to combine into an id
 * @returns A valid HTML id or null if no valid parts
 */
export function createHtmlId(...parts: (string | undefined | null)[]): string | null {
    const validParts = parts
        .map(part => sanitizeHtmlId(part))
        .filter((part): part is string => part !== null);

    if (validParts.length === 0) {
        return null;
    }

    return validParts.join('-');
}
