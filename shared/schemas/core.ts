import { z } from 'zod';

/**
 * =========================
 * CORE TYPES AND ENUMS
 * =========================
 * 
 * Basic types and enums used throughout the application
 */

export const TrackableStatusSchema = z.enum(['Yes', 'No', 'Partial', 'Special', 'Unknown']);
export type TrackableStatus = z.infer<typeof TrackableStatusSchema>;

export const UserRoleSchema = z.enum(['admin', 'ops', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Trackable status options for forms
export const TRACKABLE_STATUSES: TrackableStatus[] = [
    'Yes',
    'No',
    'Partial',
    'Special',
    'Unknown',
];
