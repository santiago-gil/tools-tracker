import { useState, useMemo, useEffect } from 'react';
import { ToolRow } from './ToolRow';
import { ToolFormModal } from './ToolFormModal';
import { ToolFilters } from './ToolFilters';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  useTools,
  useCreateTool,
  useUpdateTool,
  useDeleteTool,
  useRefreshTools,
} from '../../hooks/useTools';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import type { Tool } from '../../types';

export function ToolList() {
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

  // Detect platform for keyboard shortcut display
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modifierKey = isMac ? '⌘' : 'Ctrl';

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

  const categories = useMemo(() => {
    if (!tools) return [];
    return Array.from(new Set(tools.map((t) => t.category))).sort();
  }, [tools]);

  const filteredTools = useMemo(() => {
    if (!tools) return [];
    let filtered = [...tools];

    if (showSKRecommendedOnly) {
      filtered = filtered.filter((t) => t.versions.some((v) => v.sk_recommended));
    }

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.versions.some(
            (v) =>
              v.team_considerations?.toLowerCase().includes(query) ||
              Object.values(v.trackables).some((trackable) =>
                trackable?.notes?.toLowerCase().includes(query),
              ),
          ),
      );
    }

    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [tools, selectedCategory, debouncedSearchQuery, showSKRecommendedOnly]);

  const handleSubmit = async (toolData: Partial<Tool>) => {
    // Backend will handle sanitization and validation
    try {
      if (editingTool?.id) {
        await updateTool.mutateAsync({
          id: editingTool.id,
          tool: toolData,
        });
        setEditingTool(null);
      } else {
        await createTool.mutateAsync(toolData as Omit<Tool, 'id'>);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleDelete = async (tool: Tool) => {
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
  };

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
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onClick={() => refreshTools.mutate()}
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
          <label
            htmlFor="sk-recommended-filter"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 active:scale-95 ${
              showSKRecommendedOnly
                ? 'badge-holographic'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <input
              id="sk-recommended-filter"
              type="checkbox"
              checked={showSKRecommendedOnly}
              onChange={(e) => setShowSKRecommendedOnly(e.target.checked)}
              className="h-5 w-5 rounded"
              style={{
                accentColor: showSKRecommendedOnly ? '#ffffff' : undefined,
              }}
            />
            <span className="text-sm font-medium whitespace-nowrap">SK Recommended</span>
          </label>

          {user?.permissions?.add && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-sm px-3 py-2"
            >
              + Add Tool
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <ToolFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {!isLoading && (
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Showing {filteredTools.length} of {tools?.length ?? 0} tools
          {showSKRecommendedOnly && ' (SK Recommended)'}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : filteredTools.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
          No tools found.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTools.map((tool) => (
            <ToolRow
              key={tool.id}
              tool={tool}
              onEdit={() => setEditingTool(tool)}
              onDelete={() => handleDelete(tool)}
            />
          ))}
        </div>
      )}

      {(showAddModal || editingTool) && (
        <ToolFormModal
          tool={editingTool}
          categories={categories}
          onClose={() => {
            setShowAddModal(false);
            setEditingTool(null);
          }}
          onSubmit={handleSubmit}
          isSubmitting={createTool.isPending || updateTool.isPending}
        />
      )}
    </div>
  );
}
