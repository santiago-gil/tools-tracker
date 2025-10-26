/**
 * =========================
 * BACKEND VALIDATION - USING SHARED SCHEMAS
 * =========================
 * 
 * BREAKING CHANGE: Export names have changed from PascalCase to camelCase.
 * 
 * Schema identifiers have been renamed:
 * - ToolSchema -> toolSchema
 * - ToolVersionSchema -> toolVersionSchema
 * - TrackableFieldSchema -> trackableSchema
 * - TrackablesSchema -> trackablesSchema
 * - UserInfoSchema -> updatedBySchema
 * - UserSchema -> userSchema
 * - UserPermissionsSchema -> userPermissionsSchema
 * - UserUpdateSchema -> userUpdateSchema
 * 
 * MIGRATION REQUIRED: Consumers must update their imports to use the new
 * camelCase export names. This is a breaking change that requires a version
 * bump for downstream users.
 */

import { z } from 'zod';

// Re-export shared schemas for backward compatibility
export {
  // Tool schemas
  ToolSchema as toolSchema,
  CreateToolSchema,
  UpdateToolSchema,
  ToolVersionSchema as toolVersionSchema,
  TrackableFieldSchema as trackableSchema,
  TrackablesSchema as trackablesSchema,
  UserInfoSchema as updatedBySchema,

  // User schemas
  UserSchema as userSchema,
  UserPermissionsSchema as userPermissionsSchema,
  UserUpdateSchema as userUpdateSchema,

  // Types
  type Tool as ToolInput,
  type CreateTool,
  type UpdateTool,
  type User as UserInput,
  type UserUpdate as UserUpdateInput,
} from '../../../shared/schemas/index.js';

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
import type { User } from '../types/Users.js';

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

  for (const [permission, value] of Object.entries(permissions)) {
    // First check if the permission key exists on expectedPermissions
    if (!Object.prototype.hasOwnProperty.call(expectedPermissions, permission)) {
      logger.warn(
        { uid, role, permission, value, expectedPermissions },
        "Invalid permission key provided"
      );
      throw new Error(
        `Invalid permission key '${permission}' - not recognized for role '${role}'`
      );
    }

    // Now safely access the permission after confirming it exists
    if (value && !expectedPermissions[permission as keyof typeof expectedPermissions]) {
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
