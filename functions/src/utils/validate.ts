import { z } from 'zod';

/**
 * =========================
 * TOOL SCHEMA
 * =========================
 */
const trackableFieldSchema = z.object({
  status: z.enum(["Yes", "No", "Partial", "Special", "Unknown"]),
  notes: z.string().optional(),
});

export const toolSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  category: z.string().min(1, "Category is required"),
  gtm_ads_trackable: trackableFieldSchema.optional(),
  ga4_trackable: trackableFieldSchema.optional(),
  msa_tracking: trackableFieldSchema.optional(),
  doc_links: z.array(z.string()).optional(),
  example_sites: z.array(z.string()).optional(),
  wcs_team_considerations: z.string().optional(),
  ops_notes: z.string().optional(),
  sk_recommended: z.boolean().default(false),
});

// type of tool input from client (no id/timestamps set yet)
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
