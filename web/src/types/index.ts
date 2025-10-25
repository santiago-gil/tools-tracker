// types/index.ts

export type TrackableStatus =
  | "Yes"
  | "No"
  | "Partial"
  | "Special"
  | "Unknown";

export interface TrackableField {
  status: TrackableStatus;
  notes?: string;
  example_site?: string;
  documentation?: string;
}

export const TRACKABLE_STATUSES: TrackableStatus[] = [
  "Yes",
  "No",
  "Partial",
  "Special",
  "Unknown"
];

export interface Tool {
  id?: string;
  name: string;
  category: string;
  versions: ToolVersion[];
  updatedAt?: string;
  createdAt?: string;
  updatedBy?: UserInfo;
  _optimisticVersion?: number;
}

export interface ToolVersion {
  versionName: string;
  trackables: {
    gtm?: TrackableField;
    ga4?: TrackableField;
    google_ads?: TrackableField;
    msa?: TrackableField;
  };
  team_considerations?: string;
  sk_recommended: boolean;
}

export interface UserInfo {
  uid?: string;
  email?: string;
  name?: string;
}

export type UserRole = "admin" | "ops" | "viewer";

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  permissions?: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    manageUsers: boolean;
  };
  createdAt: string;
  updatedAt?: string;
  photoURL?: string;
  displayName?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, User['permissions']> = {
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

export interface ToolsResponse {
  tools: Tool[];
}

export interface UsersResponse {
  users: User[];
}

export interface UserResponse {
  user: User;
}

export interface CreateToolResponse {
  success: boolean;
  id: string;
  message: string;
}

export interface UpdateToolResponse {
  success: boolean;
  message: string;
  version: number;
}

export interface DeleteToolResponse {
  message: string;
}

export interface CreateToolRequest {
  tool: Omit<Tool, "id">;
}

export interface UpdateToolRequest {
  id: string;
  tool: Partial<Tool>;
}

export interface CreateUserRequest {
  user: Omit<User, "uid" | "createdAt">;
}

export interface UpdateUserRequest {
  uid: string;
  user: Partial<User>;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

export interface SuccessResponse {
  message: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}