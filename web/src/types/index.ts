export type TrackableStatus =
    | "Yes"
    | "No"
    | "Partial"
    | "Special"
    | "Unknown";

export interface TrackableField {
    status: TrackableStatus;
    notes?: string;
}

export interface Tool {
    id?: string;
    platform: string;
    category: string;
    gtm_ads_trackable?: TrackableField;
    ga4_trackable?: TrackableField;
    msa_tracking?: TrackableField;
    doc_links?: string[];
    example_sites?: string[];
    wcs_team_considerations?: string;
    ops_notes?: string;
    sk_recommended?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface User {
    uid: string;
    email: string;
    role: "viewer" | "ops" | "admin";
    permissions: {
        add: boolean;
        edit: boolean;
        delete: boolean;
        manageUsers: boolean;
    };
    createdAt?: string;
    updatedAt?: string;
}