import { z } from 'zod';
import { TrackablesSchema } from './trackables.js';
import { UserInfoSchema } from './users.js';
import { createRequiredStringField, createOptionalDateTimeField } from './validationUtils.js';

/**
 * =========================
 * TOOL SCHEMAS
 * =========================
 * 
 * Schemas for tool-related functionality
 */

export const ToolVersionSchema = z.object({
    versionName: createRequiredStringField(1, 100, 'Version name'),
    trackables: TrackablesSchema,
    // Keep empty strings as empty strings - don't transform to undefined
    team_considerations: z.string()
        .max(2000, 'Team considerations too long')
        .default('')
        .optional(), // Make it optional for backward compatibility with existing data
    sk_recommended: z.boolean().default(false),
});

/**
 * Validates that all version names within a tool are unique (case-insensitive)
 * Returns true if no duplicates, false if duplicates found
 */
function validateUniqueVersionNames(versions: Array<{ versionName: string }> | undefined): boolean {
    if (!versions || versions.length === 0) return true;
    const versionNames = versions.map(v => v.versionName.toLowerCase());
    const uniqueNames = new Set(versionNames);
    return uniqueNames.size === versionNames.length;
}

// Base tool schema for API input/output
export const ToolSchema = z.object({
    id: z.string().optional(),
    name: createRequiredStringField(1, 200, 'Name'),
    category: createRequiredStringField(1, 100, 'Category'),
    versions: z.array(ToolVersionSchema).min(1, 'At least one version is required'),
    updatedAt: createOptionalDateTimeField('Updated at'),
    createdAt: createOptionalDateTimeField('Created at'),
    updatedBy: UserInfoSchema.optional(),
    _optimisticVersion: z.number().int().min(0).optional(),

    // Normalized fields for efficient lookups
    normalizedName: z.string().optional(), // For per-category uniqueness validation
}).refine(
    (data) => validateUniqueVersionNames(data.versions),
    {
        message: 'Duplicate version names are not allowed within the same tool',
        path: ['versions'],
    }
);

// Tool creation schema (without id, timestamps)
export const CreateToolSchema = ToolSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    updatedBy: true,
    _optimisticVersion: true,
}).superRefine((data, ctx) => {
    if (!validateUniqueVersionNames(data.versions)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate version names are not allowed within the same tool',
            path: ['versions'],
        });
    }
});

// Tool update schema (partial, for PUT requests)
export const UpdateToolSchema = ToolSchema.partial().omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    updatedBy: true,
    _optimisticVersion: true,
}).superRefine((data, ctx) => {
    // Only check for duplicates if versions field is being updated
    if (data.versions && Array.isArray(data.versions)) {
        if (!validateUniqueVersionNames(data.versions)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Duplicate version names are not allowed within the same tool',
                path: ['versions'],
            });
        }
    }
});

// Export types
export type ToolVersion = z.infer<typeof ToolVersionSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type CreateTool = z.infer<typeof CreateToolSchema>;
export type UpdateTool = z.infer<typeof UpdateToolSchema>;
