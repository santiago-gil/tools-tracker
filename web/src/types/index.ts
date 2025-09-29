export interface TrackableField {
    status: "Yes" | "No" | "Partial" | "Special" | "Unknown";
    notes?: string;
}

export interface Tool {
    id?: string;
    platform: string;
    category: string;

    gtm_ads_trackable?: TrackableField;  // ✅ object not string
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