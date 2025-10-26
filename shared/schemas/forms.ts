import { z } from 'zod';
import { TrackablesSchema } from './trackables';
import { createRequiredStringFieldNoTrim, createOptionalStringFieldNoTrim } from './validationUtils';

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
    team_considerations: createOptionalStringFieldNoTrim(2000, 'Team considerations'),
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
