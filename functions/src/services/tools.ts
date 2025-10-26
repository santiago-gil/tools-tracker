import type { Tool } from "../types/Tool.js";
import type { CreateTool, UpdateTool } from "../utils/validate.js";

// Type for tools returned from service functions (with required ID)
type ToolWithId = Tool & { id: string };

// Type for successful update results
type UpdateResult = {
  success: true;
  tool: ToolWithId;
  newVersion: number;
};

// Type for failed update results
type UpdateError = {
  success: false;
  error: string;
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
      logger.info("Cache miss - fetching from Firestore");
      const snap = await toolsCol.get();
      logger.info({ count: snap.size }, "Fetched tools collection");
      return snap.docs.map((d: QueryDocumentSnapshot) => {
        const data = d.data() as Omit<Tool, "id">;

        // Auto-initialize _optimisticVersion if missing
        if (data._optimisticVersion === undefined) {
          logger.info({ toolId: d.id }, 'Tool missing _optimisticVersion, initializing to 0');
          // Update the document in the background (don't wait for it)
          d.ref.update({ _optimisticVersion: 0 }).catch((error: unknown) => {
            logger.error({ error, toolId: d.id }, 'Failed to initialize _optimisticVersion');
          });
          data._optimisticVersion = 0;
        }

        return {
          id: d.id,
          ...data,
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
export async function addTool(data: CreateTool): Promise<ToolWithId> {
  logger.info({ data }, "Adding new tool");

  const toolData = {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _optimisticVersion: 0, // Initialize version for new tools
  };

  const docRef = await toolsCol.add(toolData);

  // Invalidate cache after adding tool
  toolsCache.invalidate('all-tools');
  logger.info({ id: docRef.id }, "Tool added successfully, cache invalidated");

  // Return the full tool object
  return {
    id: docRef.id,
    ...toolData,
  };
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

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

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

    // Construct updated tool object from existing data and update payload
    const updatedTool = {
      id,
      ...currentTool,
      ...updateData,
      _optimisticVersion: newVersion,
      // Convert Firestore Timestamps to ISO strings
      createdAt: currentTool.createdAt ? convertToDateString(currentTool.createdAt) : undefined,
      updatedAt: updateData.updatedAt ? convertToDateString(updateData.updatedAt) : undefined,
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