/**
 * Generate a unique ID using crypto.getRandomValues()
 * More secure and performant than Math.random() for unique identifiers
 */
export function generateUniqueId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);

    // Convert to hex string
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a shorter unique ID (16 characters) for React keys
 * Uses 8 bytes (64 bits) for much lower collision probability
 * Good balance between uniqueness and performance
 */
export function generateShortId(): string {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);

    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
