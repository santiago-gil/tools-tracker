import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import {
  useRouter,
  useLocation,
  useParams,
  useSearch,
  Outlet,
} from '@tanstack/react-router';
import { ToolRow } from './ToolRow';
import { ToolFormModal } from './ToolFormModal';
import { ToolFilters } from './ToolFilters';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SKRecommendedBadge } from '../common/SKRecommendedBadge';
import { X, RefreshCw, ListPlus } from 'lucide-react';
import {
  useTools,
  useCreateTool,
  useUpdateTool,
  useDeleteTool,
  useRefreshTools,
} from '../../hooks/useTools';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useToolFiltering } from '../../hooks/useToolFiltering';
import {
  useToolLookup,
  findToolByUrlKey,
  createToolUrlKey,
} from '../../utils/toolLookup';
import { normalizeName } from '@shared/schemas/stringUtils';
import type { Tool } from '../../types';
import type { ToolFormData } from '@shared/schemas';

type PendingNavigation = {
  category: string;
  tool: string;
  version?: string;
};

export const ToolList = memo(function ToolList() {
  const { user } = useAuth();
  const { data: tools, isLoading, error } = useTools();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteTool = useDeleteTool();
  const refreshTools = useRefreshTools();

  const router = useRouter();
  const pathname = useLocation({ select: (l) => l.pathname });
  const params = useParams({ strict: false }); // Use params from router
  const searchParams = useSearch({ strict: false }); // Use search params from router

  // Get category and tool from route params (only present in /tools/$category/$tool route)
  const category = params.category;
  const toolName = params.tool;
  const versionName = searchParams.v;

  // Create O(1) tool lookup map for large datasets (250-500+ tools)
  const toolLookupMap = useToolLookup(tools || []);

  // Build URL key for lookup
  const urlKey = useMemo(() => {
    if (category && toolName) {
      return createToolUrlKey(category, toolName);
    }
    return null;
  }, [category, toolName]);

  // Get expanded tool ID from URL params using O(1) lookup
  const expandedToolId = useMemo(() => {
    if (urlKey && tools) {
      const result = findToolByUrlKey(toolLookupMap, urlKey);
      return result?.tool.id || null;
    }
    return null;
  }, [urlKey, tools, toolLookupMap]);

  // Get selected version index for the expanded tool from search params
  const selectedVersionIdx = useMemo(() => {
    if (expandedToolId && tools && versionName) {
      const tool = tools.find((t) => t.id === expandedToolId);
      if (tool) {
        const versionIdx = tool.versions.findIndex((v) => v.versionName === versionName);
        if (versionIdx >= 0) {
          return versionIdx;
        }
      }
    }
    return 0; // Default to first version
  }, [expandedToolId, tools, versionName]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSKRecommendedOnly, setShowSKRecommendedOnly] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Detect platform for keyboard shortcut display (memoized)
  const isMac = useMemo(
    () =>
      typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    [],
  );
  const modifierKey = useMemo(() => (isMac ? '⌘' : 'Ctrl'), [isMac]);

  // Track pending navigation after save
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(
    null,
  );

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
      // Navigate to the updated tool
      router.navigate({
        to: '/tools/$category/$tool',
        params: { category: categorySlug, tool: toolSlug },
        search: versionSlug ? { v: versionSlug } : undefined,
      });

      // Reset pending navigation
      setPendingNavigation(null);
    }
  }, [pendingNavigation, tools, toolLookupMap, router]);

  // Add keyboard shortcut for search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.getElementById('search-tools') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Handle invalid URLs - redirect to /tools if category/tool doesn't match any tool
  useEffect(() => {
    if (
      pathname.startsWith('/tools/') &&
      pathname !== '/tools' &&
      tools &&
      expandedToolId === null &&
      !isLoading && // Don't redirect while still loading
      category &&
      toolName // Only check if we have both parts
    ) {
      // Invalid category/tool - redirect to /tools
      router.navigate({ to: '/tools' });
    }
  }, [
    expandedToolId,
    tools,
    router,
    pathname,
    isLoading,
    category,
    toolName,
    toolLookupMap,
  ]);

  // Extract filtering logic into custom hook
  const { categories, filteredTools } = useToolFiltering({
    tools,
    searchQuery: debouncedSearchQuery,
    selectedCategory,
    showSKRecommendedOnly,
  });

  const handleSubmit = useCallback(
    async (toolData: ToolFormData, versionIdx?: number) => {
      // Backend will handle sanitization and validation
      try {
        if (editingTool?.id) {
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

          // Store navigation info for after cache updates
          const categorySlug = normalizeName(toolData.category);
          const toolSlug = normalizeName(toolData.name);

          // Get the new version name from the form data (which may have been renamed)
          // Use the version index to find the correct version
          const selectedVersion = toolData.versions?.[versionIdx ?? 0]?.versionName;

          setPendingNavigation({
            category: categorySlug,
            tool: toolSlug,
            ...(selectedVersion && { version: selectedVersion }),
          });
          setEditingTool(null); // Close modal immediately
        } else {
          await createTool.mutateAsync(
            toolData as Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>,
          );
          setShowAddModal(false);
        }
      } catch (error) {
        // Error handling is done by the mutation hooks (toast notifications)
        // Log error for development debugging
        if (import.meta.env.DEV) {
          console.error('Tool save error:', error);
        }
      }
    },
    [editingTool, updateTool, createTool],
  );

  const handleDelete = useCallback(
    async (tool: Tool) => {
      if (
        !confirm(
          `Are you sure you want to delete "${tool.name}"? This action cannot be undone.`,
        )
      ) {
        return;
      }
      if (tool.id) {
        await deleteTool.mutateAsync(tool.id);
        // Collapse the expanded card if the deleted tool was expanded
        if (expandedToolId === tool.id) {
          router.navigate({ to: '/tools' });
        }
      }
    },
    [deleteTool, expandedToolId, router],
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleSKRecommendedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowSKRecommendedOnly(e.target.checked);
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    refreshTools.mutate();
  }, [refreshTools]);

  const handleAddTool = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleEditTool = useCallback(
    (tool: Tool) => {
      // Navigate to edit route instead of opening modal
      if (tool.id) {
        const categorySlug = normalizeName(tool.category);
        const toolSlug = normalizeName(tool.name);

        router.navigate({
          to: '/tools/$category/$tool/edit',
          params: { category: categorySlug, tool: toolSlug },
          search: versionName ? { v: versionName } : undefined,
        });
      }
    },
    [router, versionName],
  );

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingTool(null);
  }, []);

  const handleToggleExpanded = useCallback(
    (toolId: string) => {
      if (expandedToolId === toolId) {
        // Collapse - navigate to /tools
        router.navigate({ to: '/tools' });
      } else {
        // Expand - navigate to /tools/{category}/{tool}
        const tool = tools?.find((t) => t.id === toolId);
        if (tool) {
          const categorySlug = normalizeName(tool.category);
          const toolSlug = normalizeName(tool.name);

          router.navigate({
            to: '/tools/$category/$tool',
            params: { category: categorySlug, tool: toolSlug },
          });
        }
      }
    },
    [expandedToolId, router, tools],
  );

  // Handle version selection - update URL immediately for tools with versions
  const handleVersionSelect = useCallback(
    (toolId: string, versionIdx: number) => {
      const tool = tools?.find((t) => t.id === toolId);
      if (tool && tool.versions.length > versionIdx) {
        const categorySlug = normalizeName(tool.category);
        const toolSlug = normalizeName(tool.name);

        // Update URL immediately, even if tool is not expanded
        router.navigate({
          to: '/tools/$category/$tool',
          params: { category: categorySlug, tool: toolSlug },
          search: { v: tool.versions[versionIdx].versionName },
        });
      }
    },
    [router, tools],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Check if we're on the edit route - if so, render outlet (let edit route handle it)
  const isEditRoute = pathname.endsWith('/edit');
  if (isEditRoute) {
    return <Outlet />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
          Failed to load tools
        </div>
        <p className="text-secondary content-text">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Search Controls - Elevated container for hierarchy */}
      <div className="search-controls">
        <div className="layout-controls">
          <div className="flex-1 relative">
            <label htmlFor="search-tools" className="sr-only">
              Search tools
            </label>
            <input
              id="search-tools"
              type="search"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="input-base pr-24 sm:pr-32 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />
            {/* Clear button - only show when there's text */}
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-18 sm:right-24 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 z-20 transition-colors duration-200 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 icon-crisp"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {/* Keyboard shortcut indicator - only show when search is empty */}
            {!searchQuery && (
              <div className="absolute right-18 sm:right-24 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10">
                <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                  {modifierKey}
                </kbd>
                <span className="text-gray-400 dark:text-gray-500 text-xs">+</span>
                <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
                  K
                </kbd>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshTools.isPending}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed z-20 transition-colors duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 icon-crisp"
              title="Refresh tools data"
            >
              {refreshTools.isPending ? (
                <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <SKRecommendedBadge
              isRecommended={showSKRecommendedOnly}
              className="active:scale-95 h-10 flex items-center"
            >
              <input
                id="sk-recommended-filter"
                type="checkbox"
                checked={showSKRecommendedOnly}
                onChange={handleSKRecommendedChange}
                className="custom-checkbox"
              />
              <span className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium whitespace-nowrap">
                <span className="hidden sm:inline">SK Recommended</span>
                <span className="sm:hidden">SK</span>
              </span>
            </SKRecommendedBadge>

            {user?.permissions?.add && (
              <button
                onClick={handleAddTool}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg icon-crisp"
                title="Add Tool"
              >
                <ListPlus className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters - De-emphasized secondary controls */}
        <div className="mt-3">
          <ToolFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Loading and status indicators */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-sm text-secondary content-text">
            Loading tools...
          </span>
        </div>
      )}

      {!isLoading && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-secondary">
            Showing {filteredTools.length} of {tools?.length ?? 0} tools
            {showSKRecommendedOnly && ' (SK Recommended)'}
          </div>
          {refreshTools.isPending && (
            <div className="text-sm text-tertiary">Refreshing...</div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <LoadingSpinner className="py-12" />
        ) : filteredTools.length === 0 ? (
          <p className="text-center py-12 text-tertiary content-text">No tools found.</p>
        ) : (
          <div>
            {filteredTools
              .filter((tool): tool is Tool & { id: string } => Boolean(tool.id)) // Type guard to ensure tool.id is defined
              .map((tool) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  isExpanded={expandedToolId === tool.id}
                  selectedVersionIdx={expandedToolId === tool.id ? selectedVersionIdx : 0}
                  isNavigatedTo={expandedToolId === tool.id && urlKey !== null}
                  onToggleExpanded={() => handleToggleExpanded(tool.id)}
                  onVersionSelect={(versionIdx) =>
                    handleVersionSelect(tool.id, versionIdx)
                  }
                  onEdit={() => handleEditTool(tool)}
                  onDelete={() => handleDelete(tool)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Show modal for add or edit */}
      {(showAddModal || editingTool) && (
        <ToolFormModal
          key={
            editingTool
              ? `${editingTool.id}-${editingTool._optimisticVersion ?? 'no-version'}`
              : 'new-tool'
          }
          tool={editingTool}
          categories={categories}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          isSubmitting={createTool.isPending || updateTool.isPending}
        />
      )}
    </div>
  );
});
