import { memo, useRef, useEffect, useCallback } from 'react';
import type { Tool } from '../../types';
import { ToolRowHeader } from './ToolRowHeader';
import { ToolRowExpanded } from './ToolRowExpanded';

interface ToolRowProps {
  tool: Tool;
  isExpanded: boolean;
  selectedVersionIdx: number;
  onToggleExpanded: () => void;
  onVersionSelect: (versionIdx: number) => void;
  onEdit: (versionIdx: number) => void;
  onDelete: () => void;
  isNavigatedTo?: boolean; // Whether this tool was navigated to via URL
  onExpansionComplete?: () => void; // Called when expansion animation completes
}

function ToolRowComponent({
  tool,
  isExpanded,
  selectedVersionIdx: propSelectedVersionIdx,
  onToggleExpanded,
  onVersionSelect,
  onEdit,
  onDelete,
  isNavigatedTo,
  onExpansionComplete,
}: ToolRowProps) {
  void isNavigatedTo; // Keep for prop signature
  const toolRowRef = useRef<HTMLDivElement>(null);

  // Validate propSelectedVersionIdx and compute currentVersion safely
  const isValidIndex =
    propSelectedVersionIdx >= 0 && propSelectedVersionIdx < tool.versions.length;
  const currentVersion = isValidIndex ? tool.versions[propSelectedVersionIdx] : undefined;

  // Note: `hasExpandableContent` check removed - we don't auto-collapse anymore
  // to allow navigation to tools without expandable content

  // Note: Removed auto-collapse logic - navigation via URL should work for all tools,
  // regardless of whether they have expandable content or not. The URL navigation will
  // select the correct version and scroll to the tool, even if it's not expandable.

  // Note: Scrolling is handled by parent ToolList component to ensure
  // proper coordination with expansion animations and prevent multiple competing scrolls

  // Listen for expansion animation completion
  useEffect(() => {
    const cardElement = toolRowRef.current;
    if (!cardElement || !isExpanded || !onExpansionComplete) return;

    const handleTransitionEnd = (event: TransitionEvent) => {
      // Only trigger on the card element's own transition, not child transitions
      if (event.target === cardElement) {
        onExpansionComplete();
      }
    };

    cardElement.addEventListener('transitionend', handleTransitionEnd);
    return () => {
      cardElement.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [isExpanded, onExpansionComplete]);

  const handleEdit = useCallback(
    () => onEdit(propSelectedVersionIdx),
    [onEdit, propSelectedVersionIdx],
  );

  // Safety check for versions array
  if (!tool.versions || tool.versions.length === 0) {
    return (
      <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-[var(--border-light)] p-4">
        <div className="text-tertiary">No versions available for {tool.name}</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div
        ref={toolRowRef}
        data-tool-id={tool.id}
        className={`card elevation-2 elevation-interactive transition-colors duration-200 ${
          isExpanded ? 'expanded toolRowExpanded' : 'overflow-hidden'
        }`}
        role="article"
        aria-label={`Tool: ${tool.name}`}
      >
        <ToolRowHeader
          tool={tool}
          currentVersion={currentVersion}
          selectedVersionIdx={propSelectedVersionIdx}
          expanded={isExpanded}
          onToggleExpanded={onToggleExpanded}
          onVersionSelect={onVersionSelect}
          onEdit={handleEdit}
          onDelete={onDelete}
        />

        {/* Expanded Details */}
        {isExpanded && currentVersion && (
          <div className="toolRowExpandedContent">
            <ToolRowExpanded
              currentVersion={currentVersion}
              toolId={tool.id || ''}
              versionIdx={propSelectedVersionIdx}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const ToolRow = memo(ToolRowComponent, (prevProps, nextProps) => {
  // Re-render only if key props change
  if (prevProps.tool.id !== nextProps.tool.id) return false;
  if (prevProps.isExpanded !== nextProps.isExpanded) return false;
  if (prevProps.selectedVersionIdx !== nextProps.selectedVersionIdx) return false;
  if (prevProps.isNavigatedTo !== nextProps.isNavigatedTo) return false;

  // Re-render if tool versions changed
  if (prevProps.tool.versions.length !== nextProps.tool.versions.length) return false;

  // Re-render if current version data changed
  const prevVersion = prevProps.tool.versions[prevProps.selectedVersionIdx];
  const nextVersion = nextProps.tool.versions[nextProps.selectedVersionIdx];

  // Check for mismatched existence (one defined, other undefined)
  if (!!prevVersion !== !!nextVersion) return false;

  if (prevVersion && nextVersion) {
    if (prevVersion.versionName !== nextVersion.versionName) return false;
    if (prevVersion.sk_recommended !== nextVersion.sk_recommended) return false;
  }

  return true; // Props are equal, skip re-render
});

// Set display name for better React DevTools debugging
ToolRow.displayName = 'ToolRow';
