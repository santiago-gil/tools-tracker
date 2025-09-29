import { useApiQuery, useApiMutation } from '../hooks/useApi';
import { useState } from 'react';
import { listTools, createTool, updateTool } from '../api/tools';
import type { Tool } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { Button } from '../components/Button';
import { ToolRow } from '../components/ToolRow';
import { ToolFormModal } from '../components/ToolFormModal';

const CATEGORIES = [
  'Website Backends',
  'Marketing/SEO Companies',
  'User Consent Systems',
  'Forms / Booking Tools',
  'Chat Tools',
];

export default function ToolsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [activeCategory, setActiveCategory] = useState('');

  const toolsQuery = useApiQuery({
    queryKey: ['tools'],
    queryFn: listTools,
  });

  const createMutation = useApiMutation(createTool, {
    onSuccess: () => toolsQuery.refetch(),
  });
  const updateMutation = useApiMutation(
    (vars: { id: string; data: Partial<Tool> }) => updateTool(vars.id, vars.data),
    { onSuccess: () => toolsQuery.refetch() },
  );

  const filteredTools =
    toolsQuery.data?.filter(
      (tool) => !activeCategory || tool.category === activeCategory,
    ) || [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
        <div className="flex-1">
          <input
            className="w-full rounded-lg border-gray-300 focus:ring-brand-red focus:border-brand-red"
            placeholder="Search by tool name, notes, or category..."
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setModalOpen(true)}>+ Add New Entry</Button>
          <Button variant="secondary">Import</Button>
          <Button variant="secondary">Export</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!activeCategory ? 'primary' : 'secondary'}
          onClick={() => setActiveCategory('')}
        >
          All
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'primary' : 'secondary'}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* List */}
      {toolsQuery.isLoading ? (
        <LoadingSpinner />
      ) : toolsQuery.isError ? (
        <ErrorState error={toolsQuery.error} />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool: Tool) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                onEdit={(t) => {
                  setEditingTool(t);
                  setModalOpen(true);
                }}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-10">No entries found.</div>
          )}
        </div>
      )}

      {/* Modal */}
      <ToolFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTool(null);
        }}
        initialData={editingTool || {}}
        submitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={(toolData) => {
          if (editingTool) {
            updateMutation.mutate({ id: editingTool.id!, data: toolData });
          } else {
            createMutation.mutate(toolData);
          }
        }}
      />
    </div>
  );
}
