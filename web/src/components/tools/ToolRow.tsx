import { useState, useRef, useEffect, useCallback } from 'react';
import type { Tool, ToolVersion } from '../../types';
import { ToolRowHeader } from './ToolRowHeader';
import { ToolRowExpanded } from './ToolRowExpanded';

// Check if a version has expandable content
const hasExpandableContent = (version: ToolVersion): boolean => {
  const hasTeamConsiderations = !!version?.team_considerations;
  const hasTrackableContent = Object.entries(version?.trackables || {}).some(
    ([, trackable]) =>
      trackable?.notes || trackable?.example_site || trackable?.documentation,
  );
  return hasTeamConsiderations || hasTrackableContent;
};

interface ToolRowProps {
  tool: Tool;
  isExpanded: boolean;
  selectedVersionIdx: number;
  onToggleExpanded: () => void;
  onVersionSelect: (versionIdx: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ToolRow({
  tool,
  isExpanded,
  selectedVersionIdx: propSelectedVersionIdx,
  onToggleExpanded,
  onVersionSelect,
  onEdit,
  onDelete,
}: ToolRowProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const toolRowRef = useRef<HTMLDivElement>(null);

  // Handle version selection - notify parent only
  const handleVersionSelect = useCallback(
    (versionIdx: number) => {
      onVersionSelect(versionIdx);
    },
    [onVersionSelect],
  );

  // Validate propSelectedVersionIdx and compute currentVersion safely
  const isValidIndex =
    propSelectedVersionIdx >= 0 && propSelectedVersionIdx < tool.versions.length;
  const currentVersion = isValidIndex ? tool.versions[propSelectedVersionIdx] : undefined;

  const isExpandable = currentVersion ? hasExpandableContent(currentVersion) : false;

  // Collapse if switching to a version without expandable content
  useEffect(() => {
    if (!isExpandable && isExpanded) {
      onToggleExpanded();
    }
  }, [isExpandable, isExpanded, onToggleExpanded]);

  // Scroll to expanded tool if it's not in viewport
  useEffect(() => {
    if (isExpanded && toolRowRef.current) {
      const element = toolRowRef.current;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Check if the element is not fully visible
      if (rect.bottom > viewportHeight || rect.top < 0) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }
    }
  }, [isExpanded]);

  // Safety check for versions array
  if (!tool.versions || tool.versions.length === 0) {
    return (
      <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-[var(--border-light)] p-4">
        <div className="text-tertiary">No versions available for {tool.name}</div>
      </div>
    );
  }

  return (
    <div
      ref={toolRowRef}
      className={`card elevation-2 elevation-interactive transition-all duration-200 ${
        isExpanded ? 'expanded' : 'overflow-hidden'
      } ${isInteracting ? 'elevation-maintained' : ''}`}
      role="article"
      aria-label={`Tool: ${tool.name}`}
    >
      <ToolRowHeader
        tool={tool}
        currentVersion={currentVersion}
        selectedVersionIdx={propSelectedVersionIdx}
        expanded={isExpanded}
        onToggleExpanded={isExpandable ? onToggleExpanded : undefined}
        onVersionSelect={handleVersionSelect}
        onEdit={() => {
          setIsInteracting(true);
          onEdit();
          setTimeout(() => setIsInteracting(false), 200);
        }}
        onDelete={() => {
          setIsInteracting(true);
          onDelete();
          setTimeout(() => setIsInteracting(false), 200);
        }}
      />

      {/* Expanded Details */}
      {isExpanded && currentVersion && (
        <ToolRowExpanded
          currentVersion={currentVersion}
          toolId={tool.id || ''}
          versionIdx={propSelectedVersionIdx}
        />
      )}
    </div>
  );
}
