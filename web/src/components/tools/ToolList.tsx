import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { useRouter, useLocation } from '@tanstack/react-router';
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
import { useSlugLookup, findToolBySlug, createSlug } from '../../utils/slugUtils';
import type { Tool } from '../../types';
import type { ToolFormData } from '@shared/schemas';

export const ToolList = memo(function ToolList() {
  const { user } = useAuth();
  const { data: tools, isLoading, error } = useTools();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteTool = useDeleteTool();
  const refreshTools = useRefreshTools();

  const router = useRouter();
  const pathname = useLocation({ select: (l) => l.pathname });

  // Create O(1) slug lookup map with automatic cache invalidation
  const slugLookupMap = useSlugLookup(tools || []);

  // Extract toolSlug from URL for optimized lookup
  const toolSlug =
    pathname.startsWith('/tools/') && pathname !== '/tools'
      ? pathname.split('/')[2]
      : null;

  // Get expanded tool ID from URL params using O(1) client-side lookup
  const expandedToolId = useMemo(() => {
    if (toolSlug && tools) {
      const result = findToolBySlug(slugLookupMap, toolSlug);
      return result?.tool.id || null;
    }
    return null;
  }, [toolSlug, tools, slugLookupMap]);

  // Get selected version index for the expanded tool
  const selectedVersionIdx = useMemo(() => {
    if (toolSlug && tools) {
      const result = findToolBySlug(slugLookupMap, toolSlug);
      if (result) {
        // Find the version index that matches the slug
        const versionIdx = result.tool.versions.findIndex(
          (v) => v.versionName === result.version.versionName,
        );
        return versionIdx >= 0 ? versionIdx : 0;
      }
    }
    return 0; // Default to first version
  }, [toolSlug, tools, slugLookupMap]);

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

  // Handle invalid slugs - redirect to /tools if slug doesn't match any tool
  useEffect(() => {
    if (
      pathname.startsWith('/tools/') &&
      pathname !== '/tools' &&
      tools &&
      expandedToolId === null
    ) {
      // Invalid slug - redirect to /tools
      router.navigate({ to: '/tools' });
    }
  }, [expandedToolId, tools, router, pathname]);

  // Extract filtering logic into custom hook
  const { categories, filteredTools } = useToolFiltering({
    tools,
    searchQuery: debouncedSearchQuery,
    selectedCategory,
    showSKRecommendedOnly,
  });

  const handleSubmit = useCallback(
    async (toolData: ToolFormData) => {
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
          setEditingTool(null);
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
    [editingTool?.id, editingTool?._optimisticVersion, updateTool, createTool],
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

  const handleEditTool = useCallback((tool: Tool) => {
    setEditingTool(tool);
  }, []);

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
        // Expand - navigate to /tools/{toolSlug}
        const tool = tools?.find((t) => t.id === toolId);
        if (tool) {
          // Use stored slug from versions array (inline structure matching production)
          if (tool.versions.length > 0) {
            const firstVersion = tool.versions[0];

            // Use inline slug from version if available
            if (firstVersion.slug) {
              router.navigate({
                to: '/tools/$toolSlug',
                params: { toolSlug: firstVersion.slug },
              });
              return;
            }
          }

          // Fallback: create slug if not available in stored data
          try {
            if (tool.versions.length > 0) {
              const toolSlug = createSlug(tool.name, tool.versions[0].versionName);
              router.navigate({ to: '/tools/$toolSlug', params: { toolSlug } });
            } else {
              const toolSlug = createSlug(tool.name, 'default');
              router.navigate({ to: '/tools/$toolSlug', params: { toolSlug } });
            }
          } catch (error) {
            console.error('Failed to create slug:', error);
            router.navigate({ to: '/tools' });
          }
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
        try {
          const version = tool.versions[versionIdx];
          const toolSlug = createSlug(tool.name, version.versionName);

          // Update URL immediately, even if tool is not expanded
          router.navigate({ to: '/tools/$toolSlug', params: { toolSlug } });
        } catch (error) {
          console.error('Failed to create slug for version selection:', error);
        }
      }
    },
    [router, tools],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

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

      {(showAddModal || editingTool) && (
        <ToolFormModal
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
