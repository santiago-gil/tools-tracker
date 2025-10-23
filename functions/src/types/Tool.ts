export type TrackableStatus =
  | "Yes"
  | "No"
  | "Partial"
  | "Special"
  | "Unknown";

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