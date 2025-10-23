// export interface TrackableField {
//   status: "Yes" | "No" | "Partial" | "Special" | "Unknown";
//   notes?: string;
// }

// export interface DocumentationLink {
//   url: string;
//   label: string;
// }

// export interface Tool {
//   id?: string;
//   platform: string;
//   category: string;


//   gtm_trackable?: TrackableField;
//   google_ads_trackable?: TrackableField;
//   ga4_trackable?: TrackableField;
//   msa_tracking?: TrackableField;

//   doc_links?: DocumentationLink[]; 
//   example_sites?: string[];
//   wcs_team_considerations?: string;
//   ops_notes?: string;
//   sk_recommended?: boolean;

//   createdAt?: string;
//   updatedAt?: string;
// }
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