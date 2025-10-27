import { useMemo } from 'react';
import { createValidatedSlug } from '@shared/schemas/slugUtils';
import type { Tool, ToolVersion } from '@shared/schemas';

/**
 * Utility functions for creating URL-friendly slugs from tool names and versions
 * using your existing validation utilities
 */

/**
 * Creates a slug for frontend use
 * 
 * This is a stable API wrapper around the shared validation function.
 * Currently delegates to createValidatedSlug, but exists as an abstraction
 * to provide API stability for frontend consumers and allow for future
 * frontend-specific behavior if needed.
 * 
 * @param toolName - The tool name
 * @param versionName - The version name
 * @returns A validated URL-friendly slug in format: tool-name--version-name
 * @throws Error if validation fails
 */
export function createSlug(toolName: string, versionName: string): string {
    return createValidatedSlug(toolName, versionName);
}


/**
 * Builds an O(1) lookup map from tools array
 * @param tools - Array of tools to build the lookup map from
 * @returns A Map of slug -> { tool, version }
 */
function buildSlugLookupMap(tools: Array<Tool>): Map<string, { tool: Tool; version: ToolVersion }> {
    const map = new Map<string, { tool: Tool; version: ToolVersion }>();

    for (const tool of tools) {
        // Use inline slugs from versions array (matching production structure)
        for (const version of tool.versions) {
            if (version.slug) {
                map.set(version.slug, { tool, version });
            }
        }
    }

    return map;
}

/**
 * React hook for O(1) slug lookup with automatic cache invalidation
 * This hook memoizes the lookup map based on the tools array,
 * ensuring it's rebuilt whenever the tools change
 * 
 * @param tools - Array of tools to create lookup map for
 * @returns A Map of slug -> { tool, version }
 */
export function useSlugLookup(tools: Array<Tool>): Map<string, { tool: Tool; version: ToolVersion }> {
    return useMemo(() => buildSlugLookupMap(tools), [tools]);
}

/**
 * Finds a tool by its slug using O(1) lookup with a provided lookup map
 * This function is now pure and requires the caller to provide the lookup map
 * 
 * @param lookupMap - The lookup map from useSlugLookup hook
 * @param slug - The slug to find (format: tool-name--version-name)
 * @returns The matching tool and version, or null if not found
 */
export function findToolBySlug(
    lookupMap: Map<string, { tool: Tool; version: ToolVersion }>,
    slug: string
): { tool: Tool; version: ToolVersion } | null;
export function findToolBySlug(
    lookupMap: Array<Tool>,
    slug: string
): { tool: Tool; version: ToolVersion } | null;
export function findToolBySlug(
    lookupMap: Map<string, { tool: Tool; version: ToolVersion }> | Array<Tool>,
    slug: string
): { tool: Tool; version: ToolVersion } | null {
    if (!lookupMap || !slug) return null;

    // If it's a Map, use it directly
    if (lookupMap instanceof Map) {
        return lookupMap.get(slug) || null;
    }

    // If it's an array, build a temporary lookup map (for backward compatibility)
    const map = buildSlugLookupMap(lookupMap);
    return map.get(slug) || null;
}

