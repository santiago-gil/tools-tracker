import type { Tool, CreateTool, UpdateTool } from '../../../shared/schemas/index.js';
import { normalizeName } from '../../../shared/schemas/stringUtils.js';

// Type for tools returned from service functions (with required ID)
type ToolWithId = Tool & { id: string };

// Type for successful update results
type UpdateResult = {
  success: true;
  tool: ToolWithId;
  newVersion: number;
};

// Type for failed update results with structured error codes
type UpdateError = {
  success: false;
  error: string;
  errorCode?: string;
  newVersion?: number;
};

type UpdateToolResult = UpdateResult | UpdateError;
import { db } from "../utils/firebase.js";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import logger from "../utils/logger/index.js";
import { toolsCache } from "./cache.js";
import { logAuditEvent } from "./audit.js";
import { verifyOptimisticLock, incrementVersion } from "../middleware/optimisticLocking.js";
import type { AuthedRequest } from "../types/http.js";
import { COLLECTIONS } from "../config/collections.js";
import dayjs from 'dayjs';

// Use tools collection from config
const toolsCol = db.collection(COLLECTIONS.TOOLS);

/**
 * Normalize versions to ensure team_considerations is always a string
 */
function normalizeVersions<T extends { team_considerations?: string | null | undefined }>(versions: T[]): Array<T & { team_considerations: string }> {
  return versions.map(version => ({
    ...version,
    team_considerations: version.team_considerations ?? ''
  }));
}

/**
 * Convert various date formats to ISO string using dayjs
 */
function convertToDateString(dateValue: unknown): string {
  if (!dateValue) return '';

  try {
    // Handle Firestore Timestamp objects
    if (typeof dateValue === 'object') {
      const obj = dateValue as Record<string, unknown>;

      // Check if it's a Firestore Timestamp
      if (obj.toDate && typeof obj.toDate === 'function') {
        return dayjs((obj.toDate as () => Date)()).toISOString();
      }

      // Check if it has a seconds property (Firestore Timestamp)
      if (typeof obj.seconds === 'number') {
        return dayjs.unix(obj.seconds).toISOString();
      }
    }

    // Use dayjs to parse and convert
    return dayjs(dateValue as string | number | Date).toISOString();
  } catch (error) {
    console.warn('Could not convert date value:', dateValue, 'Error:', error);

    // Handle different types of dateValue more gracefully
    if (typeof dateValue === 'object') {
      return '';
    }

    return String(dateValue);
  }
}

/**
 * Get all tools with smart caching
 * Cache: 2 minutes fresh, 10 minutes acceptable
 */
export async function getAllTools(forceRefresh = false): Promise<Tool[]> {
  logger.info({ forceRefresh }, "Fetching all tools with caching");

  return await toolsCache.get(
    'all-tools',
    async () => {
      logger.info("Cache MISS - fetching all docs from Firestore");
      const snap = await toolsCol.get();
      logger.info({ count: snap.size }, "Fetched tools collection");
      return snap.docs.map((d: QueryDocumentSnapshot) => {
        const data = d.data() as Omit<Tool, "id">;

        // Note: If _optimisticVersion is missing, it will be initialized
        // properly by verifyOptimisticLock() when updates happen.
        // For read operations, we just set it to 0 in memory to prevent errors.
        if (data._optimisticVersion === undefined) {
          logger.warn({ toolId: d.id }, 'Tool missing _optimisticVersion, defaulting to 0 in response');
          data._optimisticVersion = 0;
        }

        // Ensure team_considerations is always a string for consistency
        const normalizedVersions = normalizeVersions(data.versions);

        return {
          id: d.id,
          ...data,
          versions: normalizedVersions,
          // Convert Firestore Timestamps to ISO strings
          createdAt: data.createdAt ? convertToDateString(data.createdAt) : undefined,
          updatedAt: data.updatedAt ? convertToDateString(data.updatedAt) : undefined,
        };
      });
    },
    forceRefresh
  );
}

/**
 * Get all tools (legacy method for backward compatibility)
 * @deprecated Use getAllTools() with caching instead
 */
export async function getTools(): Promise<Tool[]> {
  return await getAllTools();
}

/**
 * Get tools by category
 */
export async function getToolsByCategory(category: string): Promise<Tool[]> {
  logger.info({ category }, "Fetching tools by category");

  const snap = await toolsCol
    .where("category", "==", category)
    .get();

  const tools = snap.docs.map((d: QueryDocumentSnapshot) => ({
    id: d.id,
    ...(d.data() as Omit<Tool, "id">),
  }));

  logger.info({ category, count: tools.length }, "Fetched tools by category");
  return tools;
}

/**
 * Search tools by name (case-insensitive)
 */
export async function searchTools(searchTerm: string): Promise<Tool[]> {
  logger.info({ searchTerm }, "Searching tools");

  // Note: Firestore doesn't support case-insensitive search natively
  // This is a basic implementation - consider using Algolia for better search
  const snap = await toolsCol
    .where("name", ">=", searchTerm)
    .where("name", "<=", searchTerm + "\uf8ff")
    .get();

  const tools = snap.docs.map((d: QueryDocumentSnapshot) => ({
    id: d.id,
    ...(d.data() as Omit<Tool, "id">),
  }));

  // Client-side filtering for case-insensitive search
  const filtered = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  logger.info({ searchTerm, count: filtered.length }, "Search completed");
  return filtered;
}

/**
 * Get tool by ID (single read)
 */
export async function getToolById(id: string): Promise<Tool | null> {
  logger.info({ id }, "Fetching tool by ID");

  const doc = await toolsCol.doc(id).get();

  if (!doc.exists) {
    logger.warn({ id }, "Tool not found");
    return null;
  }

  const data = doc.data() as Omit<Tool, "id">;
  const tool = {
    id: doc.id,
    ...data,
    // Convert Firestore Timestamps to ISO strings
    createdAt: data.createdAt ? convertToDateString(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? convertToDateString(data.updatedAt) : undefined,
  };

  logger.info({ id }, "Tool fetched successfully");
  return tool;
}

/**
 * Add a new tool
 */
export async function addTool(data: CreateTool, req?: AuthedRequest): Promise<ToolWithId> {
  logger.info({ data }, "Adding new tool");

  // Check for duplicate tool names within the same category (case-insensitive)
  const normalizedName = normalizeName(data.name);

  // First try O(1) lookup using normalizedName index (for migrated tools)
  const queryByNormalizedName = toolsCol
    .where('category', '==', data.category)
    .where('normalizedName', '==', normalizedName)
    .limit(1);

  const existingNormalizedNameTool = await queryByNormalizedName.get();

  if (!existingNormalizedNameTool.empty) {
    const existingTool = existingNormalizedNameTool.docs[0].data();
    throw new Error(`Tool with name "${existingTool.name}" already exists in the "${data.category}" category. Please use a different name.`);
  }

  // Check for duplicate version names within tool
  // Intentionally normalize version names to lowercase (map(v => v.versionName.toLowerCase()))
  // to perform a case-insensitive uniqueness check. This means "V1" and "v1" are treated as duplicates.
  const versionNames = new Set(data.versions.map(v => v.versionName.toLowerCase()));
  if (versionNames.size !== data.versions.length) {
    throw new Error('Duplicate version names are not allowed within the same tool');
  }

  // Normalize team_considerations before writing to ensure consistency
  const normalizedVersions = normalizeVersions(data.versions);

  const toolData = {
    ...data,
    normalizedName, // Store normalized name for efficient queries
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _optimisticVersion: 0, // Initialize version for new tools
    versions: normalizedVersions,
    // Add user info if request context is available
    ...(req?.user && {
      updatedBy: {
        uid: req.user.uid,
        name: req.user.email ?? 'Unknown',
        email: req.user.email ?? undefined,
      },
    }),
  };

  logger.info({ toolData: { ...toolData, versions: '[...]' }, normalizedName }, "Tool data before saving");

  // Verify normalizedName is set before saving
  if (!toolData.normalizedName) {
    throw new Error('normalizedName is missing from toolData before save');
  }

  const docRef = await toolsCol.add(toolData);

  // Invalidate cache after adding tool
  toolsCache.invalidate('all-tools');
  logger.info({ id: docRef.id, normalizedName }, "Tool added successfully, cache invalidated");

  // Return the tool object constructed from docRef.id plus the normalized data
  const result = {
    id: docRef.id,
    ...toolData,
  };

  logger.info({ hasNormalizedName: !!result.normalizedName }, "Returning tool with normalizedName");
  return result;
}

/**
 * Update an existing tool with optimistic locking and audit logging
 */
export async function updateTool(
  id: string,
  data: UpdateTool,
  req?: AuthedRequest,
  expectedVersion?: number
): Promise<UpdateToolResult> {
  logger.info({ id, data, expectedVersion }, "Updating tool");

  try {
    // Check optimistic lock if version provided
    if (expectedVersion !== undefined) {
      const lockResult = await verifyOptimisticLock(id, expectedVersion);
      if (!lockResult.success) {
        return { success: false, error: lockResult.error || 'Optimistic lock failed' }; // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
      }
    }

    // Get current tool data for audit logging
    const currentToolDoc = await toolsCol.doc(id).get();
    if (!currentToolDoc.exists) {
      return { success: false, error: 'Tool not found' };
    }
    const currentTool = currentToolDoc.data() as Tool;

    // Check for duplicate tool names within the same category if name is changing
    const nameChanged = data.name !== undefined && data.name !== currentTool.name;

    // Calculate normalized name - use new name if changed, otherwise backfill if missing
    // This ensures legacy tools without normalizedName get it populated
    const normalizedNameForUpdate = nameChanged && data.name !== undefined
      ? normalizeName(data.name)
      : (currentTool.normalizedName ?? normalizeName(currentTool.name));

    if (nameChanged && data.name !== undefined) {
      // Reuse the already-computed normalizedNameForUpdate instead of re-computing
      const category = currentTool.category; // Use existing category from the tool

      // First try O(1) lookup using normalizedName index (for migrated tools)
      const queryByNormalizedName = toolsCol
        .where('category', '==', category)
        .where('normalizedName', '==', normalizedNameForUpdate)
        .limit(1);

      const existingNormalizedNameTool = await queryByNormalizedName.get();

      if (!existingNormalizedNameTool.empty) {
        const conflictingTool = existingNormalizedNameTool.docs[0];
        // Make sure it's not the same tool we're updating
        if (conflictingTool.id !== id) {
          const conflictingToolData = conflictingTool.data();
          return {
            success: false,
            error: `Tool with name "${conflictingToolData.name}" already exists in the "${category}" category. Please use a different name.`,
            errorCode: 'FIELD_EXISTS'
          };
        }
      }
    }

    // Check for duplicate version names if versions are being updated
    if (data.versions && Array.isArray(data.versions)) {
      const versionNames = data.versions.map(v => v.versionName.toLowerCase());
      const uniqueNames = new Set(versionNames);

      if (uniqueNames.size !== versionNames.length) {
        return {
          success: false,
          error: 'Duplicate version names are not allowed within the same tool',
          errorCode: 'DUPLICATE_VERSION'
        };
      }
    }

    const updateData = {
      ...data,
      // Always ensure normalizedName is set (for legacy tools without it)
      normalizedName: normalizedNameForUpdate,
      updatedAt: new Date().toISOString(),
      // Add user info if request context available
      ...(req?.user && {
        updatedBy: {
          uid: req.user.uid,
          name: req.user.email ?? 'Unknown',
          email: req.user.email ?? undefined,
        },
      }),
    };

    logger.info({ id, normalizedName: normalizedNameForUpdate, hasUpdatedBy: !!updateData.updatedBy }, "Updating tool with data");

    // Perform the update
    await toolsCol.doc(id).update(updateData);

    // Firestore update() always returns a WriteResult, so no need to check

    // Increment version for optimistic locking
    const newVersion = await incrementVersion(id);

    // Log audit event if request context provided
    if (req) {
      const changes = Object.keys(data).map(key => ({
        field: key,
        oldValue: currentTool[key as keyof Tool],
        newValue: data[key as keyof typeof data]
      }));

      await logAuditEvent(req, 'UPDATE', 'tool', id, changes);
    }

    // Invalidate cache after updating tool
    toolsCache.invalidate('all-tools');
    logger.info({ id, newVersion }, "Tool updated successfully, cache invalidated");

    // Read fresh tool data from Firestore to ensure we have the exact structure
    const freshToolDoc = await toolsCol.doc(id).get();

    if (!freshToolDoc.exists) {
      return { success: false, error: 'Tool not found after update' };
    }

    const freshToolData = freshToolDoc.data() as Tool;

    // Ensure team_considerations is always a string for consistency
    const normalizedVersions = normalizeVersions(freshToolData.versions);

    // Construct updated tool object from fresh data
    const updatedTool = {
      id,
      ...freshToolData,
      versions: normalizedVersions,
      _optimisticVersion: newVersion,
      // Convert Firestore Timestamps to ISO strings
      createdAt: freshToolData.createdAt ? convertToDateString(freshToolData.createdAt) : undefined,
      updatedAt: freshToolData.updatedAt ? convertToDateString(freshToolData.updatedAt) : undefined,
    };

    return { success: true, tool: updatedTool, newVersion };
  } catch (error) {
    logger.error({ error, id }, "Failed to update tool");
    return { success: false, error: 'Failed to update tool' };
  }
}

/**
 * Delete a tool
 */
export async function deleteTool(id: string): Promise<void> {
  logger.info({ id }, "Deleting tool");

  await toolsCol.doc(id).delete();

  // Firestore delete() always returns a WriteResult, so no need to check

  // Invalidate cache after deleting tool
  toolsCache.invalidate('all-tools');
  logger.info({ id }, "Tool deleted successfully, cache invalidated");
}