import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearch } from '@tanstack/react-router';
import { ToolFormModal } from './ToolFormModal';
import { useTools, useUpdateTool } from '../../hooks/useTools';
import { normalizeName } from '@shared/schemas/stringUtils';
import {
  useToolLookup,
  findToolByUrlKey,
  createToolUrlKey,
} from '../../utils/toolLookup';
import { useDebounce } from '../../hooks/useDebounce';
import { useToolFiltering } from '../../hooks/useToolFiltering';
import type { Tool } from '../../types';
import type { ToolFormData } from '@shared/schemas';

type PendingNavigation = {
  category: string;
  tool: string;
  version?: string;
};

export function ToolEdit() {
  const { data: tools, isLoading } = useTools();
  const updateTool = useUpdateTool();

  const router = useRouter();
  const params = useParams({ strict: false });
  const searchParams = useSearch({ strict: false });

  const category = params.category;
  const toolName = params.tool;
  const versionName = searchParams.v;

  // Create O(1) tool lookup map
  const toolLookupMap = useToolLookup(tools || []);

  // Build URL key for lookup
  const urlKey = useMemo(() => {
    if (category && toolName) {
      return createToolUrlKey(category, toolName);
    }
    return null;
  }, [category, toolName]);

  // Get the tool being edited
  const editingTool = useMemo(() => {
    if (urlKey && tools) {
      const result = findToolByUrlKey(toolLookupMap, urlKey);
      return result?.tool || null;
    }
    return null;
  }, [urlKey, tools, toolLookupMap]);

  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(
    null,
  );

  // Track successful saves to force ToolFormModal remount with fresh data
  const [refreshKey, setRefreshKey] = useState(0);
  const [justSaved, setJustSaved] = useState(false);

  // Dummy state for tool filtering (required by hook)
  const [searchQuery] = useState('');
  const [selectedCategory] = useState('');

  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get categories for the form
  const { categories } = useToolFiltering({
    tools,
    searchQuery: debouncedSearchQuery,
    selectedCategory,
    showSKRecommendedOnly: false,
  });

  // Track when cache updates after a save to refresh the form
  useEffect(() => {
    if (!justSaved || !editingTool) return;

    // Increment refresh key after the cache has updated and component has re-rendered
    // This ensures ToolFormModal remounts with fresh cached data
    setRefreshKey((prev) => prev + 1);
    setJustSaved(false);
  }, [editingTool, justSaved]);

  // Navigate to tool after save - runs when tools cache updates after save
  useEffect(() => {
    if (!pendingNavigation || !tools) return;

    const {
      category: categorySlug,
      tool: toolSlug,
      version: versionSlug,
    } = pendingNavigation;

    // Build URL key and check if it exists in lookup map
    const urlKey = createToolUrlKey(categorySlug, toolSlug);
    const result = findToolByUrlKey(toolLookupMap, urlKey);

    if (result) {
      // Navigate to the updated tool (exit edit mode)
      router.navigate({
        to: '/tools/$category/$tool',
        params: { category: categorySlug, tool: toolSlug },
        search: versionSlug ? { v: versionSlug } : undefined,
      });

      // Reset pending navigation
      setPendingNavigation(null);
    }
  }, [pendingNavigation, tools, toolLookupMap, router]);

  const handleSubmit = useCallback(
    async (toolData: ToolFormData, versionIdx?: number) => {
      if (!editingTool?.id) return;

      try {
        await updateTool.mutateAsync({
          id: editingTool.id,
          tool: toolData as Partial<
            Omit<
              Tool,
              'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | '_optimisticVersion'
            >
          >,
          expectedVersion: editingTool._optimisticVersion || 0,
        });

        // Get the new version name from the form data (which may have been renamed)
        // Use the version index to find the correct version
        // Validate and clamp versionIdx to prevent undefined access
        // Defaults to 0 if versions array is empty or index is invalid (negative, non-integer, or out-of-range)
        const safeVersionIdx = (() => {
          if (!toolData.versions || toolData.versions.length === 0) return 0;
          if (versionIdx === undefined || versionIdx === null) return 0;
          if (
            !Number.isInteger(versionIdx) ||
            versionIdx < 0 ||
            versionIdx >= toolData.versions.length
          ) {
            return 0;
          }
          return versionIdx;
        })();
        const selectedVersion = toolData.versions[safeVersionIdx];
        const newVersionName = selectedVersion?.versionName;

        // Mark that we just saved - this will trigger a refresh after cache updates
        setJustSaved(true);

        // Store navigation info for after cache updates
        const categorySlug = normalizeName(toolData.category);
        const toolSlug = normalizeName(toolData.name);
        setPendingNavigation({
          category: categorySlug,
          tool: toolSlug,
          ...(newVersionName && { version: newVersionName }),
        });
      } catch (error) {
        // Error handling is done by the mutation hooks (toast notifications)
        if (import.meta.env.DEV) {
          console.error('Tool save error:', error);
        }
      }
    },
    [editingTool, updateTool],
  );

  const handleClose = useCallback(() => {
    // Navigate back to view
    if (category && toolName) {
      router.navigate({
        to: '/tools/$category/$tool',
        params: { category, tool: toolName },
      });
    } else {
      // Fallback: go to tools list
      router.navigate({ to: '/tools' });
    }
  }, [category, toolName, router]);

  const handleEditModeVersionSelect = useCallback(
    (versionName: string) => {
      if (category && toolName) {
        router.navigate({
          to: '/tools/$category/$tool/edit',
          params: { category, tool: toolName },
          search: { v: versionName },
        });
      }
    },
    [category, toolName, router],
  );

  // Show loading state while fetching tool data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-2 text-sm text-secondary content-text">Loading tool...</p>
        </div>
      </div>
    );
  }

  // Show not found state if tool doesn't exist
  if (!editingTool) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Tool not found
          </p>
          <p className="mt-2 text-sm text-secondary content-text">
            The tool you're looking for doesn't exist or has been moved.
          </p>
          <button
            onClick={handleClose}
            className="mt-4 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToolFormModal
      key={`edit-${editingTool.id}-${versionName ?? editingTool._optimisticVersion ?? 'no-version'}-${refreshKey}`}
      tool={editingTool}
      categories={categories}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isSubmitting={updateTool.isPending}
      initialVersionName={versionName}
      onVersionSelect={handleEditModeVersionSelect}
    />
  );
}
