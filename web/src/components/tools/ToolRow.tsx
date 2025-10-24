import { useState } from 'react';
import type { Tool } from '../../types';
import { ToolRowHeader } from './ToolRowHeader';
import { ToolRowExpanded } from './ToolRowExpanded';

interface ToolRowProps {
  tool: Tool;
  onEdit: () => void;
  onDelete: () => void;
}

export function ToolRow({ tool, onEdit, onDelete }: ToolRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);

  // Safety check for versions array
  if (!tool.versions || tool.versions.length === 0) {
    return (
      <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
        <div className="text-tertiary">No versions available for {tool.name}</div>
      </div>
    );
  }

  const currentVersion = tool.versions[selectedVersionIdx];

  return (
    <div
      className={`card elevation-2 elevation-interactive transition-all duration-200 ${
        expanded ? 'expanded' : 'overflow-hidden'
      }`}
      role="article"
      aria-label={`Tool: ${tool.name}`}
    >
      <ToolRowHeader
        tool={tool}
        currentVersion={currentVersion}
        selectedVersionIdx={selectedVersionIdx}
        expanded={expanded}
        onToggleExpanded={() => setExpanded(!expanded)}
        onVersionSelect={setSelectedVersionIdx}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Expanded Details */}
      {expanded && currentVersion && (
        <ToolRowExpanded
          currentVersion={currentVersion}
          toolId={tool.id || ''}
          versionIdx={selectedVersionIdx}
        />
      )}
    </div>
  );
}
