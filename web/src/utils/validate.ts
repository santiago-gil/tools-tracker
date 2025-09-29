import type { Tool } from "../types";

/**
 * Validate minimal tool input fields on client
 */
export function validateToolInput(data: Partial<Tool>): {
    valid: boolean;
    errors: Record<string, string>;
} {
    const errors: Record<string, string> = {};

    if (!data.platform || data.platform.trim() === "") {
        errors.platform = "Platform is required";
    }

    if (!data.category || data.category.trim() === "") {
        errors.category = "Category is required";
    }

    return { valid: Object.keys(errors).length === 0, errors };
}