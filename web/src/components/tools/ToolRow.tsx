import { useState, useRef, useEffect, useCallback } from 'react';
import type { Tool } from '../../types';
import { ToolRowHeader } from './ToolRowHeader';
import { ToolRowExpanded } from './ToolRowExpanded';

interface ToolRowProps {
  tool: Tool;
  isExpanded: boolean;
  selectedVersionIdx: number;
  onToggleExpanded: () => void;
  onVersionSelect: (versionIdx: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  isNavigatedTo?: boolean; // Whether this tool was navigated to via URL
}

export function ToolRow({
  tool,
  isExpanded,
  selectedVersionIdx: propSelectedVersionIdx,
  onToggleExpanded,
  onVersionSelect,
  onEdit,
  onDelete,
  isNavigatedTo = false,
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

  // Note: `hasExpandableContent` check removed - we don't auto-collapse anymore
  // to allow navigation to tools without expandable content

  // Note: Removed auto-collapse logic - navigation via URL should work for all tools,
  // regardless of whether they have expandable content or not. The URL navigation will
  // select the correct version and scroll to the tool, even if it's not expandable.

  // Scroll to tool if it was navigated to via URL (regardless of expandability)
  useEffect(() => {
    if (isNavigatedTo && toolRowRef.current) {
      const element = toolRowRef.current;
      // Small delay to ensure DOM is fully rendered
      const id = window.setTimeout(() => {
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }, 100);

      // Cleanup: clear timeout on unmount or when isNavigatedTo changes
      return () => {
        clearTimeout(id);
      };
    }
  }, [isNavigatedTo]);

  // Scroll to expanded tool if it's not in viewport (for click-based expansion)
  useEffect(() => {
    if (isExpanded && !isNavigatedTo && toolRowRef.current) {
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
  }, [isExpanded, isNavigatedTo]);

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
        onToggleExpanded={onToggleExpanded}
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
