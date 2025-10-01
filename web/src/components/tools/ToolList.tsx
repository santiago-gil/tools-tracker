import { useState, useMemo } from 'react';
import { ToolRow } from './ToolRow';
import { ToolFormModal } from './ToolFormModal';
import { ToolFilters } from './ToolFilters';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import {
  useTools,
  useCreateTool,
  useUpdateTool,
  useDeleteTool,
} from '../../hooks/useTools';
import { useAuth } from '../../contexts/AuthContext';
import type { Tool } from '../../types';

export function ToolList() {
  const { user } = useAuth();
  const { data: tools, isLoading, error } = useTools();
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();
  const deleteTool = useDeleteTool();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    if (!tools) return [];
    return Array.from(new Set(tools.map((t: Tool) => t.category))).sort();
  }, [tools]);

  // Filter and search
  const filteredTools = useMemo(() => {
    if (!tools) return [];

    let filtered = [...tools];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((t: Tool) => t.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t: Tool) =>
          t.platform.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.ops_notes?.toLowerCase().includes(query) ||
          t.wcs_team_considerations?.toLowerCase().includes(query),
      );
    }

    return filtered.sort((a: Tool, b: Tool) => a.platform.localeCompare(b.platform));
  }, [tools, selectedCategory, searchQuery]);

  const handleSubmit = async (toolData: Partial<Tool>) => {
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
  };

  const handleDelete = async (tool: Tool) => {
    if (
      !confirm(
        `Are you sure you want to delete "${tool.platform}"? This action cannot be undone.`,
      )
    )
      return;
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
          <input
            type="search"
            placeholder="Search by tool name, notes, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        {user?.permissions.add && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium whitespace-nowrap"
          >
            + Add New Tool
          </button>
        )}
      </div>

      {/* Filters */}
      <ToolFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Results Count */}
      {!isLoading && (
        <div className="text-sm text-gray-600">
          Showing {filteredTools.length} of {tools?.length || 0} tools
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredTools.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <p className="text-gray-600 text-lg font-medium">No tools found</p>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTools.map((tool: Tool) => (
            <ToolRow
              key={tool.id}
              tool={tool}
              onEdit={() => setEditingTool(tool)}
              onDelete={() => handleDelete(tool)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {(showAddModal || editingTool) && (
        <ToolFormModal
          tool={editingTool}
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
