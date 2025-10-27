import { z } from 'zod';
import { TrackablesSchema } from './trackables.js';
import { UserInfoSchema } from './users.js';
import { createRequiredStringField, createOptionalDateTimeField, createSlugField } from './validationUtils.js';

/**
 * =========================
 * TOOL SCHEMAS
 * =========================
 * 
 * Schemas for tool-related functionality
 */

export const ToolVersionSchema = z.object({
    versionName: createRequiredStringField(1, 100, 'Version name'),
    slug: createSlugField(3, 200).optional(),
    trackables: TrackablesSchema,
    // Transform empty strings to undefined so Firestore ignores them
    team_considerations: z.string()
        .max(2000, 'Team considerations too long')
        .transform(val => (val?.trim() ?? '') === '' ? undefined : val)
        .optional(),
    sk_recommended: z.boolean().default(false),
});

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

    // Slug-related fields (added during migration)
    normalizedName: createSlugField(1, 200).optional(),
    _slugLastUpdated: createOptionalDateTimeField('Slug last updated'),
    _slugMigrationVersion: z.number().int().min(0).optional(),
    _slugMigrationDate: createOptionalDateTimeField('Slug migration date'),
});

// Tool creation schema (without id, timestamps)
export const CreateToolSchema = ToolSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    updatedBy: true,
    _optimisticVersion: true,
});

// Tool update schema (partial, for PUT requests)
export const UpdateToolSchema = ToolSchema.partial().omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    updatedBy: true,
    _optimisticVersion: true,
    _slugLastUpdated: true,
    _slugMigrationVersion: true,
    _slugMigrationDate: true,
});

// Export types
export type ToolVersion = z.infer<typeof ToolVersionSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type CreateTool = z.infer<typeof CreateToolSchema>;
export type UpdateTool = z.infer<typeof UpdateToolSchema>;
