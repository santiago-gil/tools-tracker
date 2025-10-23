import { useState, useMemo } from 'react';
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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
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

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [tools, selectedCategory, searchQuery, showSKRecommendedOnly]);

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
        <div className="text-red-600 text-lg font-semibold mb-2">
          Failed to load tools
        </div>
        <p className="text-gray-600">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search-tools" className="sr-only">
            Search tools
          </label>
          <input
            id="search-tools"
            type="search"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base"
          />
        </div>
        <div className="flex gap-3">
          <label
            htmlFor="sk-recommended-filter"
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition"
          >
            <input
              id="sk-recommended-filter"
              type="checkbox"
              checked={showSKRecommendedOnly}
              onChange={(e) => setShowSKRecommendedOnly(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm font-medium whitespace-nowrap">
              SK Recommended Only
            </span>
          </label>

          <button
            onClick={() => refreshTools.mutate()}
            disabled={refreshTools.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {refreshTools.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Refreshing...
              </>
            ) : (
              <>
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
                Refresh
              </>
            )}
          </button>

          {user?.permissions?.add && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
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
        <div className="text-sm text-gray-600">
          Showing {filteredTools.length} of {tools?.length ?? 0} tools
          {showSKRecommendedOnly && ' (SK Recommended)'}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : filteredTools.length === 0 ? (
        <p className="text-center py-12 text-gray-500">No tools found.</p>
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
