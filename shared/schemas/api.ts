import { z } from 'zod';
import { ToolSchema } from './tools.js';
import { UserSchema } from './users.js';

/**
 * =========================
 * API RESPONSE SCHEMAS
 * =========================
 * 
 * Schemas for API response types
 */

export const ToolsResponseSchema = z.object({
    tools: z.array(ToolSchema),
});

export const SingleToolResponseSchema = z.object({
    tool: ToolSchema,
});

export const UsersResponseSchema = z.object({
    users: z.array(UserSchema),
});

export const SingleUserResponseSchema = z.object({
    user: UserSchema,
});

export const CreateToolResponseSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        tool: ToolSchema,
        message: z.string(),
    }),
    z.object({
        success: z.literal(false),
        message: z.string(),
        error: z.string().optional(),
    }),
]);

export const UpdateToolResponseSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        tool: ToolSchema,
        message: z.string(),
        version: z.number(),
    }),
    z.object({
        success: z.literal(false),
        message: z.string(),
        error: z.string().optional(),
    }),
]);

export const DeleteToolResponseSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        message: z.string(),
    }),
    z.object({
        success: z.literal(false),
        message: z.string(),
        error: z.string().optional(),
    }),
]);

// Export types
export type ToolsResponse = z.infer<typeof ToolsResponseSchema>;
export type SingleToolResponse = z.infer<typeof SingleToolResponseSchema>;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;
export type SingleUserResponse = z.infer<typeof SingleUserResponseSchema>;
export type CreateToolResponse = z.infer<typeof CreateToolResponseSchema>;
export type UpdateToolResponse = z.infer<typeof UpdateToolResponseSchema>;
export type DeleteToolResponse = z.infer<typeof DeleteToolResponseSchema>;
