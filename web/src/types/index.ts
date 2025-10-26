/**
 * =========================
 * TYPES - DERIVED FROM SHARED SCHEMAS
 * =========================
 * 
 * All types are now derived from the shared schemas in lib/schemas.ts
 * This ensures consistency across the entire application.
 */

// Re-export all types from shared schemas
export {
  // Core types
  type TrackableStatus,
  type UserRole,

  // Data types
  type TrackableField,
  type Trackables,
  type Tool,
  type ToolVersion,
  type User,
  type UserInfo,
  type UserPermissions,
  type UserUpdate,

  // Form types
  type ToolFormData,
  type VersionFormData,

  // API response types
  type ToolsResponse,
  type SingleToolResponse,
  type UsersResponse,
  type SingleUserResponse,
  type CreateToolResponse,
  type UpdateToolResponse,
  type DeleteToolResponse,

  // Request types
  type CreateTool,
  type UpdateTool,

  // Constants
  TRACKABLE_STATUSES,
  ROLE_PERMISSIONS,
} from '@shared/schemas';

// Import types for use in this file
import type {
  User as UserType,
  CreateTool as CreateToolType,
  UpdateTool as UpdateToolType,
  UserUpdate as UserUpdateType,
} from '@shared/schemas';

// Legacy type aliases for backward compatibility
export type CreateToolRequest = {
  tool: CreateToolType;
};

export type UpdateToolRequest = {
  id: string;
  tool: UpdateToolType;
};

export type CreateUserRequest = {
  user: Omit<UserType, "uid" | "createdAt">;
};

export type UpdateUserRequest = {
  uid: string;
  user: UserUpdateType;
};

export type ErrorResponse = {
  error: string;
  message?: string;
};

export type SuccessResponse = {
  message: string;
};

export type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};