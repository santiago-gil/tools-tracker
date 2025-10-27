import { z } from 'zod';
import { TrackablesSchema } from './trackables.js';
import { createRequiredStringFieldNoTrim } from './validationUtils.js';

/**
 * =========================
 * FORM SCHEMAS
 * =========================
 * 
 * Schemas specifically for form validation (no transformations)
 * These are used for frontend form validation
 */

// Version form schema (no transformations for form input)
export const VersionFormSchema = z.object({
    versionName: createRequiredStringFieldNoTrim(1, 100, 'Version name'),
    trackables: TrackablesSchema,
    // Allow null so we can distinguish "empty" from "don't update" in partial updates
    team_considerations: z.string()
        .max(2000, 'Team considerations too long')
        .nullable()
        .optional(),
    sk_recommended: z.boolean(),
});

// Form schema for tool creation/editing (no transformations for form input)
export const ToolFormSchema = z.object({
    name: createRequiredStringFieldNoTrim(1, 200, 'Name'),
    category: createRequiredStringFieldNoTrim(1, 100, 'Category'),
    versions: z.array(VersionFormSchema).min(1, 'At least one version is required'),
});

// Export types
export type ToolFormData = z.infer<typeof ToolFormSchema>;
export type VersionFormData = z.infer<typeof VersionFormSchema>;
