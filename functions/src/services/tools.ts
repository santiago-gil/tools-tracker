import type { Tool } from "../types/Tool.js";
import type { ToolInput } from "../utils/validate.js";
import { db } from "../utils/firebase.js";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import logger from "../utils/logger/index.js";
import { toolsCache } from "./cache.js";
import { sanitizeToolData } from "../utils/sanitize.js";
import dayjs from 'dayjs';

const toolsCol = db.collection(process.env.FIREBASE_COLLECTION || "tools");

/**
 * Convert various date formats to ISO string using dayjs
 */
function convertToDateString(dateValue: unknown): string {
  if (!dateValue) return '';

  try {
    // Handle Firestore Timestamp objects
    if (dateValue && typeof dateValue === 'object') {
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
    return dayjs(dateValue as any).toISOString();
  } catch (error) {
    console.warn('Could not convert date value:', dateValue);
    return String(dateValue || '');
  }
}

/**
 * Get all tools with smart caching
 * Cache: 2 minutes fresh, 10 minutes acceptable
 */
export async function getAllTools(forceRefresh = false): Promise<Tool[]> {
  logger.info({ forceRefresh }, "Fetching all tools with caching");

  return toolsCache.get(
    'all-tools',
    async () => {
      logger.info("Cache miss - fetching from Firestore");
      const snap = await toolsCol.get();
      logger.info({ count: snap.size }, "Fetched tools collection");
      return snap.docs.map((d: QueryDocumentSnapshot) => {
        const data = d.data() as Omit<Tool, "id">;
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
  return getAllTools();
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
export async function addTool(data: ToolInput): Promise<string> {
  logger.info({ data }, "Adding new tool");

  // Sanitize data on backend for security
  const sanitizedData = sanitizeToolData(data);

  const toolData = {
    ...sanitizedData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await toolsCol.add(toolData);

  // Invalidate cache after adding tool
  toolsCache.invalidate('all-tools');
  logger.info({ id: docRef.id }, "Tool added successfully, cache invalidated");

  return docRef.id;
}

/**
 * Update an existing tool
 */
export async function updateTool(id: string, data: Partial<ToolInput>): Promise<void> {
  logger.info({ id, data }, "Updating tool");

  // Sanitize data on backend for security
  const sanitizedData = sanitizeToolData(data);

  const updateData = {
    ...sanitizedData,
    updatedAt: new Date().toISOString(),
  };

  await toolsCol.doc(id).update(updateData);

  // Invalidate cache after updating tool
  toolsCache.invalidate('all-tools');
  logger.info({ id }, "Tool updated successfully, cache invalidated");
}

/**
 * Delete a tool
 */
export async function deleteTool(id: string): Promise<void> {
  logger.info({ id }, "Deleting tool");

  await toolsCol.doc(id).delete();

  // Invalidate cache after deleting tool
  toolsCache.invalidate('all-tools');
  logger.info({ id }, "Tool deleted successfully, cache invalidated");
}