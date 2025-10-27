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

/**
 * Branded type for ISO 8601 date strings
 * Used to ensure type safety for date fields that must be in ISO format
 */
export type ISODateString = string & { readonly __brand: 'ISODateString' };

/**
 * Zod schema for validating ISO 8601 date strings
 * Validates that the string matches ISO 8601 format and can be parsed as a valid date
 */
export const ISODateStringSchema = z.string()
    .refine((val) => {
        // Check if it's a valid ISO 8601 date string
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) return false;
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, 'Must be a valid ISO 8601 datetime string')
    .transform((val): ISODateString => val as ISODateString);

/**
 * Type guard for ISODateString
 * @param value - The value to check
 * @returns true if value is a valid ISO date string
 */
export function isISODateString(value: unknown): value is ISODateString {
    return ISODateStringSchema.safeParse(value).success;
}

/**
 * Parses and validates an ISO date string
 * @param value - The value to parse
 * @returns A validated ISODateString
 * @throws ZodError if value is not a valid ISO date string
 */
export function parseISODateString(value: unknown): ISODateString {
    return ISODateStringSchema.parse(value);
}

/**
 * Safely attempts to parse an ISO date string
 * @param value - The value to parse
 * @returns A validated ISODateString or null if parsing fails
 */
export function tryParseISODateString(value: unknown): ISODateString | null {
    const result = ISODateStringSchema.safeParse(value);
    return result.success ? result.data : null;
}

// Trackable status options for forms
export const TRACKABLE_STATUSES: TrackableStatus[] = [
    'Yes',
    'No',
    'Partial',
    'Special',
    'Unknown',
];
