/**
 * Enhanced tool update service that maintains slug fields
 * Uses inline slugs in versions array (matching production structure)
 */

import { db as firestore } from '../utils/firebase.js';
import { CANONICAL_COLLECTIONS } from '../config/collections.js';
import logger from '../utils/logger/index.js';
import { normalizeName } from '../../../shared/schemas/slugUtils.js';
import { verifyOptimisticLock, incrementVersion } from '../middleware/optimisticLocking.js';
import { logAuditEvent } from '../services/audit.js';
import { toolsCache } from '../services/cache.js';
import { getAllTools } from './tools.js';
import type { Tool, UpdateTool, ToolVersion } from '../../../shared/schemas/index.js';
import type { AuthedRequest } from '../types/http.js';

const toolsCol = firestore.collection(CANONICAL_COLLECTIONS.TOOLS);

/**
 * Checks if a value is a Firestore Timestamp object
 */
function isFirestoreTimestamp(value: unknown): value is { toDate: () => Date } {
    return (
        typeof value === 'object' &&
        value !== null &&
        'toDate' in value &&
        typeof (value as { toDate?: unknown }).toDate === 'function'
    );
}

/**
 * Converts a value to an ISO string
 * Handles Firestore Timestamps, Unix timestamps (numbers), and existing strings
 */
function toISOString(value: unknown): string | undefined {
    if (!value) return undefined;

    // Handle Firestore Timestamp objects
    if (isFirestoreTimestamp(value)) {
        return value.toDate().toISOString();
    }

    // Handle Unix timestamp numbers
    if (typeof value === 'number') {
        return new Date(value).toISOString();
    }

    // Handle already valid strings
    if (typeof value === 'string') {
        return value;
    }

    return undefined;
}


/**
 * Ensures all versions have slugs (inline in versions array, matching production structure)
 */
function ensureSlugsInVersions(tool: { name: string; versions: ToolVersion[] }): ToolVersion[] {
    const normalizedName = normalizeName(tool.name);

    return tool.versions.map(version => {
        // Use existing slug or generate one
        if (version.slug) {
            return version;
        }

        const normalizedVersion = normalizeName(version.versionName);
        const slug = `${normalizedName}--${normalizedVersion}`;

        return {
            ...version,
            slug
        };
    });
}

/**
 * Enhanced updateTool function that maintains slug fields
 * This should replace the existing updateTool function after migration
 */
export async function updateToolWithSlugs(
    id: string,
    data: UpdateTool,
    req?: AuthedRequest,
    expectedVersion?: number
): Promise<{ success: boolean; tool?: Tool; newVersion?: number; error?: string }> {
    logger.info({ id, data, expectedVersion }, "Updating tool with slug maintenance");

    try {
        // Check optimistic lock if version provided
        if (expectedVersion !== undefined) {
            const lockResult = await verifyOptimisticLock(id, expectedVersion);
            if (!lockResult.success) {
                return { success: false, error: lockResult.error ?? 'Optimistic lock failed' };
            }
        }

        // Get current tool data
        const currentToolDoc = await toolsCol.doc(id).get();
        if (!currentToolDoc.exists) {
            return { success: false, error: 'Tool not found' };
        }
        const currentTool = currentToolDoc.data() as Tool;

        // Merge current tool with update data
        const updatedToolData = {
            ...currentTool,
            ...data,
        };

        // Generate new slug fields if name or versions changed
        const nameChanged = data.name !== undefined && data.name !== currentTool.name;

        // Lightweight comparison for versions: check length and versionNames
        // Only versionName affects slug generation, so no need for deep equality of nested trackables
        let versionsChanged = false;
        if (data.versions !== undefined) {
            if (data.versions.length !== currentTool.versions.length) {
                versionsChanged = true;
            } else {
                // Same length - compare versionNames element-by-element
                for (let i = 0; i < data.versions.length; i++) {
                    if (data.versions[i].versionName !== currentTool.versions[i].versionName) {
                        versionsChanged = true;
                        break;
                    }
                }
            }
        }

        // Ensure slugs are set on versions array (inline structure matching production)
        if (data.versions) {
            data.versions = ensureSlugsInVersions({
                name: updatedToolData.name,
                versions: data.versions
            });
            logger.info({ id, nameChanged, versionsChanged, versionsCount: data.versions.length }, "Ensuring slugs in versions");
        }

        // Prepare update data with slugs in versions array
        const updateData = {
            ...data,
            ...(nameChanged && {
                normalizedName: normalizeName(updatedToolData.name),
                _slugLastUpdated: new Date().toISOString()
            }),
            updatedAt: new Date().toISOString(),
        };

        // Remove undefined values before sending to Firestore
        const cleanedUpdateData = removeUndefinedValues(updateData) as Partial<Tool>;

        // Perform the update
        // Note: Schema now handles converting empty strings to undefined
        // We remove undefined values so Firestore doesn't receive them
        await toolsCol.doc(id).update(cleanedUpdateData);

        // Increment version for optimistic locking
        const newVersion = await incrementVersion(id);

        // Log audit event if request context provided
        if (req) {
            const changes = Object.keys(data).map(key => ({
                field: key,
                oldValue: currentTool[key as keyof Tool],
                newValue: data[key as keyof typeof data]
            }));

            // Add slug field changes to audit log
            if (nameChanged || versionsChanged) {
                changes.push({
                    field: 'slugFields',
                    oldValue: currentTool.normalizedName ? 'present' : 'missing',
                    newValue: 'updated'
                });
            }

            await logAuditEvent(req, 'UPDATE', 'tool', id, changes);
        }

        // Invalidate cache after updating tool
        toolsCache.invalidate('all-tools');

        logger.info({ id, newVersion, hasVersionsUpdate: !!data.versions },
            "Tool updated successfully with slug maintenance");

        // Read fresh tool data from Firestore (Option 4: always return fresh data)
        const freshToolDoc = await toolsCol.doc(id).get();

        if (!freshToolDoc.exists) {
            return { success: false, error: 'Tool not found after update' };
        }

        const freshToolData = freshToolDoc.data() as Tool;

        // Construct updated tool object from fresh data
        // Convert Firestore Timestamps to ISO strings
        const createdAt = toISOString(freshToolData.createdAt);

        const updatedTool = {
            id,
            ...freshToolData,
            _optimisticVersion: newVersion,
            createdAt,
            updatedAt: cleanedUpdateData.updatedAt as string,
        };

        logger.info({ id }, "Returning fresh tool data from Firestore");
        return { success: true, tool: updatedTool, newVersion };
    } catch (error) {
        logger.error({ error, id }, "Failed to update tool with slug maintenance");
        return { success: false, error: (error as Error).message || String(error) };
    }
}

/**
 * Recursive utility type that makes all properties optional at all levels
 */
type DeepPartial<T> = T extends object
    ? T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

/**
 * Recursively removes undefined values from an object
 * Firestore requires this even with ignoreUndefinedProperties setting
 */
function removeUndefinedValues<T>(obj: T): DeepPartial<T> {
    if (obj === null || typeof obj !== 'object') {
        return obj as DeepPartial<T>;
    }

    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedValues).filter(item => item !== undefined) as DeepPartial<T>;
    }

    const cleaned: Partial<Record<keyof T, unknown>> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (value !== undefined) {
            cleaned[key as keyof T] = removeUndefinedValues(value);
        }
    }
    return cleaned as DeepPartial<T>;
}

/**
 * Enhanced addTool function that includes slug fields
 * This should replace the existing addTool function after migration
 */
export async function addToolWithSlugs(data: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | '_optimisticVersion'>): Promise<Tool & { id: string }> {
    logger.info({ data }, "Adding new tool with slug fields");

    try {
        // Ensure slugs are set on versions array (inline structure matching production)
        const versionsWithSlugs = ensureSlugsInVersions(data);
        const normalizedName = normalizeName(data.name);

        const toolData = {
            ...data,
            versions: versionsWithSlugs,
            normalizedName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _optimisticVersion: 0,
            _slugMigrationVersion: 1
        };

        // Remove undefined values from the object (Firestore doesn't accept them even with ignoreUndefinedProperties)
        // Note: toolData already includes createdAt and updatedAt, so only omitting 'id'
        const cleanedToolData = removeUndefinedValues(toolData) as Omit<Tool, 'id'>;

        const docRef = await toolsCol.add(cleanedToolData);

        // Invalidate cache after adding tool
        toolsCache.invalidate('all-tools');

        logger.info({ id: docRef.id }, "Tool added successfully with inline slugs in versions array, cache invalidated");

        // Return the full tool object
        return {
            id: docRef.id,
            ...cleanedToolData,
        } as Tool & { id: string };
    } catch (error) {
        logger.error({ error, data }, 'Failed to add tool with slug fields');
        throw error; // Re-throw to let caller handle
    }
}

/**
 * Lookup tool by slug - searches through versions array (matching production structure)
 * Uses existing toolsCache from getAllTools() to reduce Firestore reads
 * (250 reads per cache miss, 0 reads per cache hit with 2-minute TTL)
 */
export async function findToolBySlugDB(slug: string): Promise<{ tool: Tool; version: ToolVersion } | null> {
    if (!slug || typeof slug !== 'string') {
        logger.warn({ slug }, 'Invalid slug parameter');
        return null;
    }

    try {
        logger.info({ slug }, 'Looking up tool by slug');

        // Use getAllTools() which is already cached (2-minute TTL, 10-minute stale-while-revalidate)
        // This means: 0 Firestore reads if tools are already cached (which they usually are)
        // Only 250 reads when cache expires or cold start
        // IMPORTANT: Cache is SHARED across all users in the same function instance.
        // One user's GET /tools populates the cache for ALL users' slug lookups.
        const tools = await getAllTools();

        logger.info({ slug, toolsCount: tools.length }, 'Got tools from cache/database');

        // Search through cached tools
        for (const tool of tools) {
            // Find version with matching slug
            const version = tool.versions.find((v: ToolVersion) => v.slug === slug);

            if (version) {
                logger.info({ slug, toolId: tool.id }, 'Tool found by slug in versions array');
                return { tool, version };
            }
        }

        logger.info({ slug }, 'Tool not found by slug');
        return null;

    } catch (error) {
        logger.error({ error, slug }, 'Database lookup failed');
        return null;
    }
}
