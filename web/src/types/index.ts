// export type TrackableStatus =
//     | "Yes"
//     | "No"
//     | "Partial"
//     | "Special"
//     | "Unknown";

// export interface TrackableField {
//     status: TrackableStatus;
//     notes?: string;
// }

// export interface Tool {
//     id?: string;
//     platform: string;
//     category: string;
//     gtm_ads_trackable?: TrackableField;
//     ga4_trackable?: TrackableField;
//     msa_tracking?: TrackableField;
//     doc_links?: string[];
//     example_sites?: string[];
//     wcs_team_considerations?: string;
//     ops_notes?: string;
//     sk_recommended?: boolean;
//     createdAt?: string;
//     updatedAt?: string;
// }

// export interface User {
//     uid: string;
//     email: string;
//     role: "viewer" | "ops" | "admin";
//     permissions: {
//         add: boolean;
//         edit: boolean;
//         delete: boolean;
//         manageUsers: boolean;
//     };
//     createdAt?: string;
//     updatedAt?: string;
// }
// export type TrackableStatus =
//     | "Yes"
//     | "No"
//     | "Partial"
//     | "Special"
//     | "Unknown";

// export interface TrackableField {
//     status: TrackableStatus;
//     notes?: string;
// }

// export interface DocumentationLink {
//     url: string;
//     label: string; // e.g., "GTM Setup", "GA4 Integration", "Official Docs"
// }

// export interface Tool {
//     id?: string;
//     platform: string;
//     category: string;

//     // Separate tracking fields
//     gtm_trackable?: TrackableField;
//     google_ads_trackable?: TrackableField;
//     ga4_trackable?: TrackableField;
//     msa_tracking?: TrackableField;

//     doc_links?: DocumentationLink[];
//     example_sites?: string[];
//     wcs_team_considerations?: string;
//     ops_notes?: string;
//     sk_recommended?: boolean;

//     createdAt?: string;
//     updatedAt?: string;
// }

/**
 * =========================
 * USER TYPES
 * =========================
 */

export type UserRole = 'viewer' | 'ops' | 'admin';

export interface UserPermissions {
  add: boolean;
  edit: boolean;
  delete: boolean;
  manageUsers: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  permissions: UserPermissions;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Default role-based permissions mapping.
 * Keep in sync with backend ROLE_DEFAULT_PERMISSIONS.
 */
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  viewer: { add: false, edit: false, delete: false, manageUsers: false },
  ops: { add: true, edit: true, delete: false, manageUsers: false },
  admin: { add: true, edit: true, delete: true, manageUsers: true },
};

/**
 * =========================
 * TOOL TYPES
 * =========================
 */
export const TRACKABLE_STATUSES = ['Yes', 'No', 'Partial', 'Special', 'Unknown'] as const;

export type TrackableStatus = (typeof TRACKABLE_STATUSES)[number];

export interface Trackable {
  status: TrackableStatus;
  notes?: string;
  example_site?: string;
  documentation?: string;
}

export interface Trackables {
  gtm?: Trackable;
  ga4?: Trackable;
  google_ads?: Trackable;
  msa?: Trackable;
}

export interface DocumentationLink {
  url: string;
  label: string;
}

export interface ToolVersion {
  versionName: string;
  trackables: Trackables;
  team_considerations?: string;
  sk_recommended: boolean;
}

export interface UserInfo {
  uid?: string;
  name?: string;
  email?: string;
}

export interface Tool {
  id?: string;
  name: string;
  category: string;
  versions: ToolVersion[];
  updatedAt?: string;
  updatedBy?: UserInfo;
  createdAt?: string;
}

/**
 * =========================
 * API RESPONSE TYPES
 * =========================
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ToolsResponse {
  tools: Tool[];
}

export interface UserResponse {
  user: User;
}

export interface UsersResponse {
  users: User[];
}

export interface CreateToolResponse {
  success: boolean;
  id: string;
  message: string;
}

export interface UpdateToolResponse {
  success: boolean;
  message: string;
}

export interface DeleteToolResponse {
  success: boolean;
  message: string;
}
