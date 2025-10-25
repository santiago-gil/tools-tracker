/**
 * Firestore collection configuration
 * Centralizes collection names and allows environment-based overrides
 */

// Canonical collection names as literal constants
export const CANONICAL_COLLECTIONS = {
    TOOLS: "tools_v2",
    USERS: "users",
    AUDIT_LOGS: "audit_logs",
} as const;

// Environment overrides mapping
const ENV_OVERRIDES = {
    TOOLS: process.env.COLLECTION_TOOLS?.trim(),
    USERS: process.env.COLLECTION_USERS?.trim(),
    AUDIT_LOGS: process.env.COLLECTION_AUDIT_LOGS?.trim(),
} as const;

// Runtime collection names with environment overrides
export const COLLECTIONS = {
    TOOLS: ENV_OVERRIDES.TOOLS ?? CANONICAL_COLLECTIONS.TOOLS,
    USERS: ENV_OVERRIDES.USERS ?? CANONICAL_COLLECTIONS.USERS,
    AUDIT_LOGS: ENV_OVERRIDES.AUDIT_LOGS ?? CANONICAL_COLLECTIONS.AUDIT_LOGS,
} as const;

// Literal union type derived from canonical collection names
export type CollectionName = typeof CANONICAL_COLLECTIONS[keyof typeof CANONICAL_COLLECTIONS];
