/**
 * =========================
 * BACKEND VALIDATION - USING SHARED SCHEMAS
 * =========================
 * 
 * All schemas and types are re-exported from shared/schemas for consistency.
 */

import { z } from 'zod';
import {
  ToolSchema as SharedToolSchema,
  CreateToolSchema,
  UpdateToolSchema,
  ToolVersionSchema,
  type Tool,
  type CreateTool,
  type UpdateTool,
  UserSchema as SharedUserSchema,
  UserPermissionsSchema,
  UserUpdateSchema as SharedUserUpdateSchema,
  UserInfoSchema,
  type User,
  type UserUpdate as SharedUserUpdate,
  TrackableFieldSchema,
  TrackablesSchema
} from '../../../shared/schemas/index.js';

// Re-export with backward-compatible names
export const toolSchema = SharedToolSchema;
export { CreateToolSchema, UpdateToolSchema };
export const toolVersionSchema = ToolVersionSchema;
export const trackableSchema = TrackableFieldSchema;
export const trackablesSchema = TrackablesSchema;
export const updatedBySchema = UserInfoSchema;

export const userSchema = SharedUserSchema;
export { UserPermissionsSchema };
export const UserUpdateSchema = SharedUserUpdateSchema;

export type ToolInput = Tool;
export type { CreateTool, UpdateTool };
export type UserInput = User;
export type { SharedUserUpdate as UserUpdate };

// Backend-specific parameter schemas
export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const uidParamSchema = z.object({
  uid: z.string().min(1),
});

/**
 * =========================
 * BUSINESS LOGIC VALIDATION
 * =========================
 */

import { getUserByUid } from '../services/users.js';
import logger from './logger/index.js';

// Role permissions mapping for validation
const ROLE_DEFAULT_PERMISSIONS: Record<User["role"], User["permissions"]> = {
  viewer: {
    add: false,
    edit: false,
    delete: false,
    manageUsers: false,
  },
  ops: {
    add: true,
    edit: true,
    delete: false,
    manageUsers: false,
  },
  admin: {
    add: true,
    edit: true,
    delete: true,
    manageUsers: true,
  },
};

/**
 * Validates permissions against a role's default permissions
 */
function validatePermissionsAgainstRole(
  permissions: User["permissions"],
  role: User["role"],
  uid: string
): void {
  const expectedPermissions = ROLE_DEFAULT_PERMISSIONS[role];
  const permissionKeys: Array<keyof User["permissions"]> = ['add', 'edit', 'delete', 'manageUsers'];

  for (const permission of permissionKeys) {
    if (!(permission in permissions)) continue;

    const value = permissions[permission];
    if (value && !expectedPermissions[permission]) {
      logger.warn(
        { uid, role, permission, value, expectedPermissions },
        "Permission exceeds role capabilities"
      );
      throw new Error(
        `Permission '${permission}' is not allowed for role '${role}'`
      );
    }
  }
}

/**
 * Validates user update requests for security issues
 */
export async function validateUserUpdate(
  uid: string,
  data: Partial<Omit<User, "uid" | "createdAt">>,
  requesterUid: string
): Promise<void> {
  // 1. Prevent self-modification of role/permissions
  if (requesterUid === uid) {
    if (data.role || data.permissions) {
      logger.warn(
        { uid, requester: requesterUid, update: data },
        "Attempted self-modification of role/permissions blocked"
      );
      throw new Error("Users cannot modify their own role or permissions");
    }
  }

  // 2. Validate role-permission consistency
  if (data.role && data.permissions) {
    validatePermissionsAgainstRole(data.permissions, data.role, uid);

    logger.info(
      { uid, role: data.role, permissions: data.permissions },
      "Role-permission consistency validated"
    );
  }

  // 3. Validate permissions don't exceed role capabilities (when only permissions are provided)
  if (!data.role && data.permissions) {
    // Get current user to check their role
    const currentUser = await getUserByUid(uid);
    if (!currentUser) {
      logger.error(
        { uid },
        "Unable to verify current user for permission validation"
      );
      throw new Error(`Unable to verify current user for uid '${uid}' — permission update denied`);
    }

    validatePermissionsAgainstRole(data.permissions, currentUser.role, uid);
  }
}
