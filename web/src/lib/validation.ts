import { z } from 'zod';

export const trackableSchema = z.object({
    status: z.enum(['Yes', 'No', 'Partial', 'Special', 'Unknown']),
    notes: z.string().optional(),
    example_site: z.string().optional(),
    documentation: z.string().optional(),
});

export const trackablesSchema = z.object({
    gtm: trackableSchema.optional(),
    ga4: trackableSchema.optional(),
    google_ads: trackableSchema.optional(),
    msa: trackableSchema.optional(),
});

export const toolVersionSchema = z.object({
    versionName: z.string().min(1, 'Version name is required'),
    trackables: trackablesSchema,
    team_considerations: z.string().optional(),
    sk_recommended: z.boolean(),
});

export const userInfoSchema = z.object({
    uid: z.string().optional(),
    email: z.string().optional(),
    name: z.string().optional(),
});

export const toolFormSchema = z.object({
    name: z.string().min(1, 'Platform name is required'),
    category: z.string().min(1, 'Category is required'),
    versions: z.array(toolVersionSchema).min(1, 'At least one version is required'),
    updatedAt: z.string().optional(),
    createdAt: z.string().optional(),
    updatedBy: userInfoSchema.optional(),
});

export type ToolFormData = z.infer<typeof toolFormSchema>;
export type VersionFormData = z.infer<typeof toolVersionSchema>;
