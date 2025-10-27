import { useMemo } from 'react';
import { normalizeName } from '@shared/schemas/stringUtils';
import type { Tool, ToolVersion } from '@shared/schemas';

/**
 * Utility functions for building efficient lookup maps for large tool datasets
 * Optimized for 250-500 tools with O(1) lookup performance
 */

/**
 * Creates a URL-safe key from category and tool name
 * @param category - The tool category
 * @param toolName - The tool name
 * @returns A URL-friendly key in format: category--tool-name
 */
export function createToolUrlKey(category: string, toolName: string): string {
    const normalizedCategory = normalizeName(category);
    const normalizedToolName = normalizeName(toolName);
    return `${normalizedCategory}--${normalizedToolName}`;
}

/**
 * Builds an O(1) lookup map from tools array
 * Optimized for large datasets (250-500+ tools)
 * @param tools - Array of tools to build the lookup map from
 * @returns A Map of urlKey -> { tool, version } for the first version
 */
function buildToolLookupMap(tools: Array<Tool>): Map<string, { tool: Tool; version: ToolVersion }> {
    const map = new Map<string, { tool: Tool; version: ToolVersion }>();
    const collisions: Array<{
        urlKey: string;
        existingTool: { id?: string; name: string; category: string };
        duplicateTool: { id?: string; name: string; category: string };
    }> = [];

    for (const tool of tools) {
        if (tool.versions.length > 0) {
            const urlKey = createToolUrlKey(tool.category, tool.name);
            const version = tool.versions[0];

            // Collision detection for data integrity
            if (map.has(urlKey)) {
                const existing = map.get(urlKey)!;
                collisions.push({
                    urlKey,
                    existingTool: {
                        id: existing.tool.id,
                        name: existing.tool.name,
                        category: existing.tool.category,
                    },
                    duplicateTool: {
                        id: tool.id,
                        name: tool.name,
                        category: tool.category,
                    },
                });

                if (import.meta.env.DEV) {
                    console.warn('[buildToolLookupMap] COLLISION DETECTED:', {
                        urlKey,
                        existingTool: `${existing.tool.name} (${existing.tool.category})`,
                        duplicateTool: `${tool.name} (${tool.category})`,
                    });
                }
            } else {
                map.set(urlKey, { tool, version });
            }
        }
    }

    // Log collisions if any found
    if (collisions.length > 0) {
        console.error(`[buildToolLookupMap] Found ${collisions.length} URL key collision(s):`, collisions);
        console.error('[buildToolLookupMap] This indicates a data integrity issue - tool names should be unique per category');
    }

    return map;
}

/**
 * React hook for O(1) tool lookup with automatic cache invalidation
 * This hook memoizes the lookup map based on the tools array,
 * ensuring it's rebuilt whenever the tools change
 * 
 * @param tools - Array of tools to create lookup map for
 * @returns A Map of urlKey -> { tool, version }
 */
export function useToolLookup(tools: Array<Tool>): Map<string, { tool: Tool; version: ToolVersion }> {
    return useMemo(() => buildToolLookupMap(tools), [tools]);
}

/**
 * Finds a tool by its URL key using O(1) lookup with a provided lookup map
 * 
 * @param lookupMap - The lookup map from useToolLookup hook
 * @param urlKey - The URL key to find (format: category--tool-name)
 * @returns The matching tool and version, or null if not found
 */
export function findToolByUrlKey(
    lookupMap: Map<string, { tool: Tool; version: ToolVersion }>,
    urlKey: string
): { tool: Tool; version: ToolVersion } | null {
    if (!lookupMap || !urlKey) return null;
    return lookupMap.get(urlKey) || null;
}

