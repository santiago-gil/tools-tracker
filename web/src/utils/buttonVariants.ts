/**
 * Button variant utilities to reduce CSS class duplication
 */

// Base classes for all buttons
export const baseClasses = {
    base: 'btn-secondary text-sm px-3 py-1 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1',
    disabled: 'disabled:opacity-50',
} as const;

// Visual variants for buttons
export const variants = {
    // Default variant
    default: 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-blue-500',

    // Danger variant
    danger: 'text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600 focus:ring-red-500',
} as const;

// Type for button variants
export type Variant = keyof typeof variants;

/**
 * Combines button variant classes
 */
export function getButtonClasses(variant: Variant = 'default', disabled = false): string {
    const classes: string[] = [baseClasses.base, variants[variant]];

    if (disabled) {
        classes.push(baseClasses.disabled);
    }

    return classes.join(' ');
}
