import { useState, useRef, useEffect } from 'react';
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
  onEdit: () => void;
  onDelete: () => void;
}

export function ToolRow({ tool, onEdit, onDelete }: ToolRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const toolRowRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Validate selectedVersionIdx and compute currentVersion safely
  const isValidIndex =
    selectedVersionIdx >= 0 && selectedVersionIdx < tool.versions.length;
  const currentVersion = isValidIndex ? tool.versions[selectedVersionIdx] : undefined;

  // Reset selectedVersionIdx if it's out of bounds
  useEffect(() => {
    if (!isValidIndex && tool.versions.length > 0) {
      setSelectedVersionIdx(0);
    }
  }, [isValidIndex, tool.versions.length]);

  const isExpandable = currentVersion ? hasExpandableContent(currentVersion) : false;

  // Collapse if switching to a version without expandable content
  useEffect(() => {
    if (!isExpandable) setExpanded(false);
  }, [isExpandable]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Scroll to expanded tool if it's not in viewport
  useEffect(() => {
    if (expanded && toolRowRef.current) {
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
  }, [expanded]);

  // Safety check for versions array
  if (!tool.versions || tool.versions.length === 0) {
    return (
      <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
        <div className="text-tertiary">No versions available for {tool.name}</div>
      </div>
    );
  }

  return (
    <div
      ref={toolRowRef}
      className={`card elevation-2 elevation-interactive transition-all duration-200 ${
        expanded ? 'expanded' : 'overflow-hidden'
      } ${isInteracting ? 'elevation-maintained' : ''}`}
      role="article"
      aria-label={`Tool: ${tool.name}`}
    >
      <ToolRowHeader
        tool={tool}
        currentVersion={currentVersion}
        selectedVersionIdx={selectedVersionIdx}
        expanded={expanded}
        onToggleExpanded={isExpandable ? () => setExpanded(!expanded) : undefined}
        onVersionSelect={setSelectedVersionIdx}
        onEdit={() => {
          setIsInteracting(true);
          onEdit();
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => setIsInteracting(false), 200);
        }}
        onDelete={() => {
          setIsInteracting(true);
          onDelete();
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => setIsInteracting(false), 200);
        }}
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
