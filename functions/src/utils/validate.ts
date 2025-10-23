import { z } from 'zod';

/**
 * =========================
 * TOOL SCHEMA (v2)
 * =========================
 */

const trackableSchema = z.object({
  status: z.enum(["Yes", "No", "Partial", "Special", "Unknown"]),
  notes: z.string().max(1000).optional(),
  example_site: z.string().url().optional().or(z.literal("")),
  documentation: z.string().url().optional().or(z.literal("")),
});

const trackablesSchema = z.object({
  gtm: trackableSchema.optional(),
  ga4: trackableSchema.optional(),
  google_ads: trackableSchema.optional(),
  msa: trackableSchema.optional(),
});

const toolVersionSchema = z.object({
  versionName: z.string().min(1).max(100),
  trackables: trackablesSchema,
  team_considerations: z.string().max(2000).optional(),
  sk_recommended: z.boolean().default(false),
});

const updatedBySchema = z.object({
  uid: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
});

export const toolSchema = z.object({
  name: z.string().min(1, "Platform name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  versions: z.array(toolVersionSchema).min(1),
  updatedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedBy: updatedBySchema.optional(),
});

export type ToolInput = z.infer<typeof toolSchema>;

/**
 * =========================
 * USER SCHEMA
 * =========================
 */
export const userPermissionsSchema = z.object({
  add: z.boolean().default(false),
  edit: z.boolean().default(false),
  delete: z.boolean().default(false),
  manageUsers: z.boolean().default(false),
});

export const userSchema = z.object({
  uid: z.string().min(1, 'User UID is required'),
  email: z.string().email('Must be a valid email'),
  role: z.enum(['admin', 'ops', 'viewer']).default('viewer'),
  permissions: userPermissionsSchema.default({}),
});

export type UserInput = z.infer<typeof userSchema>;

/**
 * =========================
 * REUSABLE VALIDATORS
 * =========================
 */

// validate route params (like :id / :uid)
export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const uidParamSchema = z.object({
  uid: z.string().min(1),
});
