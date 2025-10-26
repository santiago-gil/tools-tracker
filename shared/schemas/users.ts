import { z } from 'zod';
import { UserRoleSchema } from './core';
import { createOptionalStringField, createRequiredDateTimeField, createOptionalDateTimeField } from './validationUtils';

/**
 * =========================
 * USER SCHEMAS
 * =========================
 * 
 * Schemas for user-related functionality
 */

export const UserPermissionsSchema = z.object({
    add: z.boolean().default(false),
    edit: z.boolean().default(false),
    delete: z.boolean().default(false),
    manageUsers: z.boolean().default(false),
});

export const UserInfoSchema = z.object({
    uid: z.string().optional(),
    email: z.string().email('Must be a valid email address').optional(),
    name: createOptionalStringField(100, 'Name'),
});

// Full user schema for API responses
export const UserSchema = z.object({
    uid: z.string().min(1, 'User UID is required'),
    email: z.preprocess(
        (val: unknown) => typeof val === 'string' ? val.trim().toLowerCase() : val,
        z.string().min(1, "Email is required").email('Must be a valid email')
    ),
    role: UserRoleSchema.default('viewer'),
    permissions: UserPermissionsSchema.default({}),
    createdAt: createRequiredDateTimeField('Created at'),
    updatedAt: createOptionalDateTimeField('Updated at'),
    photoURL: z.string().url().optional(),
    displayName: createOptionalStringField(100, 'Display name'),
});

// User update schema for PUT requests
export const UserUpdateSchema = z.object({
    role: UserRoleSchema.optional(),
    permissions: UserPermissionsSchema.partial().optional(),
}).strict();

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<z.infer<typeof UserRoleSchema>, z.infer<typeof UserPermissionsSchema>> = {
    admin: {
        add: true,
        edit: true,
        delete: true,
        manageUsers: true,
    },
    ops: {
        add: true,
        edit: true,
        delete: false,
        manageUsers: false,
    },
    viewer: {
        add: false,
        edit: false,
        delete: false,
        manageUsers: false,
    },
};

// Export types
export type UserPermissions = z.infer<typeof UserPermissionsSchema>;
export type UserInfo = z.infer<typeof UserInfoSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
