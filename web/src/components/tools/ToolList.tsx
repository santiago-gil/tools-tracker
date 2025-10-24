import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { ToolRow } from './ToolRow';
import { ToolFormModal } from './ToolFormModal';
import { ToolFilters } from './ToolFilters';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DynamicVirtualizedList } from '../common/DynamicVirtualizedList';
import { SKRecommendedBadge } from '../common/SKRecommendedBadge';
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
import { useWindowSize } from '../../hooks/useWindowSize';
import type { Tool } from '../../types';

export const ToolList = memo(function ToolList() {
  const { user } = useAuth();
  const { data: tools, isLoading, error } = useTools();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteTool = useDeleteTool();
  const refreshTools = useRefreshTools();

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

  // Extract filtering logic into custom hook
  const { categories, filteredTools } = useToolFiltering({
    tools,
    searchQuery: debouncedSearchQuery,
    selectedCategory,
    showSKRecommendedOnly,
  });

  // Get window size for responsive virtual scrolling
  const { height: windowHeight } = useWindowSize();

  const handleSubmit = useCallback(
    async (toolData: Partial<Tool>) => {
      // Backend will handle sanitization and validation
      try {
        if (editingTool?.id) {
          await updateTool.mutateAsync({
            id: editingTool.id,
            tool: toolData,
            expectedVersion: editingTool._optimisticVersion || 0,
          });
          setEditingTool(null);
        } else {
          await createTool.mutateAsync(toolData as Omit<Tool, 'id'>);
          setShowAddModal(false);
        }
      } catch (error) {
        console.error('Error in handleSubmit:', error);
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
      }
    },
    [deleteTool],
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

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
          Failed to load tools
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
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
            className="input-base pr-20"
          />
          {/* Keyboard shortcut indicator */}
          <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
              {modifierKey}
            </kbd>
            <span className="text-gray-400 dark:text-gray-500 text-xs">+</span>
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600">
              K
            </kbd>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshTools.isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed z-10 transition-colors duration-200"
            title="Refresh tools data"
          >
            {refreshTools.isPending ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="flex gap-3">
          <SKRecommendedBadge
            isRecommended={showSKRecommendedOnly}
            className="active:scale-95"
          >
            <input
              id="sk-recommended-filter"
              type="checkbox"
              checked={showSKRecommendedOnly}
              onChange={handleSKRecommendedChange}
              className="h-5 w-5 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              style={{
                accentColor: showSKRecommendedOnly ? '#8b5cf6' : undefined,
              }}
            />
            <span className="text-sm font-medium whitespace-nowrap">SK Recommended</span>
          </SKRecommendedBadge>

          {user?.permissions?.add && (
            <button onClick={handleAddTool} className="btn-primary text-sm px-3 py-2">
              + Add Tool
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <ToolFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Loading and status indicators */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading tools...
          </span>
        </div>
      )}

      {!isLoading && (
        <div className="flex items-center justify-between">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Showing {filteredTools.length} of {tools?.length ?? 0} tools
            {showSKRecommendedOnly && ' (SK Recommended)'}
          </div>
          {refreshTools.isPending && (
            <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Refreshing...
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : filteredTools.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
          No tools found.
        </p>
      ) : (
        <div className="relative">
          <DynamicVirtualizedList
            items={filteredTools}
            defaultItemHeight={120} // Approximate height of each ToolRow when collapsed
            containerHeight={Math.min(600, windowHeight * 0.6)} // Responsive height
            renderItem={({ item: tool, index }) => (
              <div
                key={tool.id}
                className={`${index === 0 ? 'virtual-first-item' : ''} mb-3`}
              >
                <ToolRow
                  tool={tool}
                  onEdit={() => handleEditTool(tool)}
                  onDelete={() => handleDelete(tool)}
                />
              </div>
            )}
            className="custom-scrollbar"
            overscan={5} // Render 5 extra items above/below for smooth scrolling
          />
        </div>
      )}

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
