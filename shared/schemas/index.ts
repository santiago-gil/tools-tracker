/**
 * =========================
 * SHARED SCHEMAS - MAIN EXPORT
 * =========================
 * 
 * This is the main entry point for all shared schemas and types.
 * Import everything you need from this file.
 */

import { z } from 'zod';
import { ToolSchema, CreateToolSchema, UpdateToolSchema } from './tools';
import { UserSchema, UserUpdateSchema } from './users';
import { ToolFormSchema, VersionFormSchema } from './forms';
import { ToolsResponseSchema, SingleToolResponseSchema, UsersResponseSchema, SingleUserResponseSchema, CreateToolResponseSchema, UpdateToolResponseSchema, DeleteToolResponseSchema } from './api';

// Core types and enums
export * from './core';

// URL validation utilities (now in validationUtils)

// Trackable schemas
export * from './trackables';

// User schemas
export * from './users';

// Tool schemas
export * from './tools';

// Form schemas
export * from './forms';

// API response schemas
export * from './api';

// Validation utilities
export * from './validationUtils';

/**
 * =========================
 * SCHEMA VALIDATION HELPERS
 * =========================
 */

// Validate and transform data using schemas
export function validateTool(data: unknown): z.infer<typeof ToolSchema> {
    return ToolSchema.parse(data);
}

export function validateCreateTool(data: unknown): z.infer<typeof CreateToolSchema> {
    return CreateToolSchema.parse(data);
}

export function validateUpdateTool(data: unknown): z.infer<typeof UpdateToolSchema> {
    return UpdateToolSchema.parse(data);
}

export function validateUser(data: unknown): z.infer<typeof UserSchema> {
    return UserSchema.parse(data);
}

export function validateUserUpdate(data: unknown): z.infer<typeof UserUpdateSchema> {
    return UserUpdateSchema.parse(data);
}

// Generic safe validation helper
function createSafeValidator<T extends z.ZodTypeAny>(schema: T) {
    return (data: unknown): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } => {
        const result = schema.safeParse(data);
        if (result.success) {
            return { success: true, data: result.data };
        }
        return { success: false, error: result.error };
    };
}

// Safe validation (returns success/error instead of throwing)
export const safeValidateTool = createSafeValidator(ToolSchema);
export const safeValidateCreateTool = createSafeValidator(CreateToolSchema);
export const safeValidateUpdateTool = createSafeValidator(UpdateToolSchema);
export const safeValidateUser = createSafeValidator(UserSchema);
export const safeValidateUserUpdate = createSafeValidator(UserUpdateSchema);

// Form validation (for frontend)
export const safeValidateToolForm = createSafeValidator(ToolFormSchema);
export const safeValidateVersionForm = createSafeValidator(VersionFormSchema);

// API response validation (for external data)
export const safeValidateToolsResponse = createSafeValidator(ToolsResponseSchema);
export const safeValidateUsersResponse = createSafeValidator(UsersResponseSchema);
export const safeValidateSingleToolResponse = createSafeValidator(SingleToolResponseSchema);
export const safeValidateSingleUserResponse = createSafeValidator(SingleUserResponseSchema);
export const safeValidateCreateToolResponse = createSafeValidator(CreateToolResponseSchema);
export const safeValidateUpdateToolResponse = createSafeValidator(UpdateToolResponseSchema);
export const safeValidateDeleteToolResponse = createSafeValidator(DeleteToolResponseSchema);
