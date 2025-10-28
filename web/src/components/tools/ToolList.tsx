import {
  useState,
  useMemo,
  useEffect,
  memo,
  useCallback,
  lazy,
  Suspense,
  useRef,
} from 'react';
import { useRouter, useLocation, useParams, useSearch } from '@tanstack/react-router';
import { ToolRow } from './ToolRow';
import { ToolFilters } from './ToolFilters';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SKRecommendedBadge } from '../common/SKRecommendedBadge';
import { DynamicVirtualizedList } from '../common/DynamicVirtualizedList';

// Lazy load the form modal to reduce initial bundle size
const ToolFormModal = lazy(() =>
  import('./ToolFormModal').then((module) => ({
    default: module.ToolFormModal,
  })),
);
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
  const params = useParams({ strict: false });
  const searchParams = useSearch({ strict: false });

  // Get category and tool from route params (only present in /tools/$category/$tool route)
  const category = params.category;
  const toolName = params.tool;
  const versionName = searchParams.v;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSKRecommendedOnly, setShowSKRecommendedOnly] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editingToolVersionIdx, setEditingToolVersionIdx] = useState<number>(0);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [localVersionIdx, setLocalVersionIdx] = useState<number | null>(null);
  const virtualizerRef = useRef<{
    scrollToIndex: (index: number) => void;
    measure: () => void;
  } | null>(null);

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

  // Get selected version index for the expanded tool from search params or local state
  const selectedVersionIdx = useMemo(() => {
    // Use local version if it's been set (for quick version switches)
    if (localVersionIdx !== null && expandedToolId) {
      return localVersionIdx;
    }

    // Otherwise use URL params
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
  }, [expandedToolId, tools, versionName, localVersionIdx]);

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
    // Only run this effect on specific route paths, not on every render
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
    pathname,
    isLoading,
    category,
    toolName,
    router, // router is stable, it's safe to include
  ]);

  // Extract filtering logic into custom hook
  const { categories, filteredTools } = useToolFiltering({
    tools,
    searchQuery: debouncedSearchQuery,
    selectedCategory,
    showSKRecommendedOnly,
  });

  // Track if we need to scroll after expansion completes
  const pendingScrollIndexRef = useRef<number | null>(null);

  // Scroll callback triggered after expansion animation completes
  const handleExpansionComplete = useCallback(() => {
    // Always clear the pending scroll state when expansion completes
    // For direct navigation, the useEffect handles scrolling to avoid double-scroll
    // For user-initiated expansions, we prevent the ref from staying stale
    pendingScrollIndexRef.current = null;
  }, []);

  // Set up pending scroll when expanded tool changes (including direct navigation)
  useEffect(() => {
    if (
      !expandedToolId ||
      !filteredTools ||
      filteredTools.length === 0 ||
      !virtualizerRef.current
    )
      return;
    if (isLoading) return; // Don't scroll while still loading

    const index = filteredTools
      .filter((tool): tool is Tool & { id: string } => Boolean(tool.id))
      .findIndex((tool) => tool.id === expandedToolId);

    if (index >= 0) {
      // Store the index to scroll to after expansion completes
      pendingScrollIndexRef.current = index;

      // Check if this is direct navigation (have category/toolName in URL)
      const isDirectNavigation = category && toolName;

      if (isDirectNavigation) {
        // Extract scroll logic to avoid closure issues
        const performScroll = () => {
          const toolCard = document.querySelector(`[data-tool-id="${expandedToolId}"]`);
          const mainElement = document.querySelector('main');

          if (!toolCard || !mainElement) return;

          // Batch ALL layout reads at once to prevent layout thrashing
          const cardRect = toolCard.getBoundingClientRect();
          const mainRect = mainElement.getBoundingClientRect();
          const scrollTop = mainElement.scrollTop;

          // Check if card is fully visible with comfortable padding
          const padding = 40;
          const isCardFullyVisible =
            cardRect.top >= mainRect.top + padding &&
            cardRect.bottom <= mainRect.bottom - padding;

          if (!isCardFullyVisible) {
            // Single layout write
            const scrollToPosition = cardRect.top - mainRect.top + scrollTop - padding;

            mainElement.scrollTo({
              top: Math.max(0, scrollToPosition),
              behavior: 'auto',
            });
          }
        };

        // Optimal scroll using RAF - wait for paint cycle before reading layout
        const rafScroll = () => {
          requestAnimationFrame(() => {
            requestAnimationFrame(performScroll);
          });
        };

        // Wait for DOM to be ready and animations to start settling
        const initialDelay = setTimeout(rafScroll, 150);

        // Also listen for transitionend to catch when animations complete
        const toolCard = document.querySelector(`[data-tool-id="${expandedToolId}"]`);
        const cleanup = () => {
          clearTimeout(initialDelay);
          if (toolCard) {
            toolCard.removeEventListener('transitionend', performScroll);
          }
        };

        if (toolCard) {
          toolCard.addEventListener('transitionend', performScroll, { once: true });
        }

        return cleanup;
      }
    }
  }, [expandedToolId, filteredTools, isLoading, category, toolName]);

  const handleSubmit = useCallback(
    async (toolData: ToolFormData, versionIdx?: number) => {
      // Backend will handle sanitization and validation
      try {
        if (isAddingTool) {
          // Creating new tool
          await createTool.mutateAsync(toolData);
          setIsAddingTool(false);
        } else if (editingTool?.id) {
          // Updating existing tool
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
        }
      } catch (error) {
        // Error handling is done by the mutation hooks (toast notifications)
        // Log error for development debugging
        if (import.meta.env.DEV) {
          console.error('Tool save error:', error);
        }
      }
    },
    [editingTool, updateTool, createTool, isAddingTool],
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
    setIsAddingTool(true);
  }, []);

  const handleEditTool = useCallback((tool: Tool, versionIdx: number = 0) => {
    // Open modal for editing (no route navigation for faster UX)
    setEditingTool(tool);
    setEditingToolVersionIdx(versionIdx);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingTool(null);
    setEditingToolVersionIdx(0);
    setIsAddingTool(false);
  }, []);

  const handleToggleExpanded = useCallback(
    (toolId: string) => {
      if (expandedToolId === toolId) {
        // Collapse - navigate to /tools and clear local version
        setLocalVersionIdx(null);
        router.navigate({ to: '/tools' });
      } else {
        // Expand - navigate to /tools/{category}/{tool}
        setLocalVersionIdx(null); // Reset local version when expanding new tool
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

  // Handle version selection - use local state for fast switching (no navigation for expanded tool)
  const handleVersionSelect = useCallback(
    (toolId: string, versionIdx: number) => {
      // Only update URL if navigating to a different tool
      if (toolId !== expandedToolId) {
        const tool = tools?.find((t) => t.id === toolId);
        if (tool && tool.versions.length > versionIdx) {
          const categorySlug = normalizeName(tool.category);
          const toolSlug = normalizeName(tool.name);

          // Navigate to the tool with the selected version
          router.navigate({
            to: '/tools/$category/$tool',
            params: { category: categorySlug, tool: toolSlug },
            search: { v: tool.versions[versionIdx].versionName },
          });
        }
      } else {
        // Same tool, different version - just update local state (fast, no navigation)
        setLocalVersionIdx(versionIdx);
      }
    },
    [router, tools, expandedToolId],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Create stable callback references for each tool to support memoization
  // Only recompute when the list of tools changes, not when version state changes
  const toolCallbacks = useMemo(() => {
    if (!filteredTools) return new Map();

    const callbacks = new Map<
      string,
      {
        onToggleExpanded: () => void;
        onVersionSelect: (versionIdx: number) => void;
        onEdit: (versionIdx: number) => void;
        onDelete: () => void;
      }
    >();

    filteredTools
      .filter((tool): tool is Tool & { id: string } => Boolean(tool.id))
      .forEach((tool) => {
        callbacks.set(tool.id, {
          onToggleExpanded: () => handleToggleExpanded(tool.id),
          onVersionSelect: (versionIdx: number) =>
            handleVersionSelect(tool.id, versionIdx),
          onEdit: (versionIdx: number) => handleEditTool(tool, versionIdx),
          onDelete: () => handleDelete(tool),
        });
      });

    return callbacks;
  }, [
    filteredTools,
    handleDelete,
    handleEditTool,
    handleToggleExpanded,
    handleVersionSelect,
  ]);

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

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isLoading ? (
          <LoadingSpinner className="py-12" />
        ) : filteredTools.length === 0 ? (
          <p className="text-center py-12 text-tertiary content-text">No tools found.</p>
        ) : (
          <DynamicVirtualizedList
            ref={virtualizerRef}
            items={filteredTools.filter((tool): tool is Tool & { id: string } =>
              Boolean(tool.id),
            )}
            defaultItemHeight={200}
            containerHeight="100%"
            overscan={3}
            renderItem={({ item: tool }) => {
              const typedTool = tool as Tool;
              const callbacks = toolCallbacks.get(typedTool.id);
              if (!callbacks) return null;

              const isThisExpanded = expandedToolId === typedTool.id;
              return (
                <ToolRow
                  key={typedTool.id}
                  tool={typedTool}
                  isExpanded={isThisExpanded}
                  selectedVersionIdx={isThisExpanded ? selectedVersionIdx : 0}
                  isNavigatedTo={isThisExpanded && urlKey !== null}
                  onToggleExpanded={callbacks.onToggleExpanded}
                  onVersionSelect={callbacks.onVersionSelect}
                  onEdit={callbacks.onEdit}
                  onDelete={callbacks.onDelete}
                  onExpansionComplete={
                    isThisExpanded
                      ? () => {
                          handleExpansionComplete();
                        }
                      : undefined
                  }
                />
              );
            }}
          />
        )}
      </div>

      {/* Show modal for edit or add - lazy loaded */}
      {(editingTool || isAddingTool) && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                <LoadingSpinner />
              </div>
            </div>
          }
        >
          <ToolFormModal
            key={
              editingTool
                ? `${editingTool.id}-${editingTool._optimisticVersion ?? 'no-version'}-v${editingToolVersionIdx}`
                : 'new-tool'
            }
            tool={editingTool}
            categories={categories}
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            isSubmitting={Boolean(
              (isAddingTool && createTool.isPending) ||
                (editingTool && updateTool.isPending),
            )}
            initialVersionName={
              editingTool && editingTool.versions.length > editingToolVersionIdx
                ? editingTool.versions[editingToolVersionIdx].versionName
                : undefined
            }
          />
        </Suspense>
      )}
    </div>
  );
});
