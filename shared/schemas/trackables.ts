import { z } from 'zod';
import { TrackableStatusSchema } from './core';
import { createUrlSchema } from './validationUtils';

/**
 * =========================
 * TRACKABLE SCHEMAS
 * =========================
 * 
 * Schemas for trackable fields and related functionality
 */

// Base trackable field schema (status required, other fields optional)
export const TrackableFieldSchema = z.object({
    status: TrackableStatusSchema,
    notes: z.string().max(1000).optional(),
    example_site: createUrlSchema('example site URL').optional(),
    documentation: createUrlSchema('documentation URL').optional(),
});

export const TrackablesSchema = z.object({
    gtm: TrackableFieldSchema.optional(),
    ga4: TrackableFieldSchema.optional(),
    google_ads: TrackableFieldSchema.optional(),
    msa: TrackableFieldSchema.optional(),
});

// Export types
export type TrackableField = z.infer<typeof TrackableFieldSchema>;
export type Trackables = z.infer<typeof TrackablesSchema>;
