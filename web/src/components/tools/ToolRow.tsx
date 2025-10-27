import { memo, useRef, useEffect } from 'react';
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

function ToolRowComponent({
  tool,
  isExpanded,
  selectedVersionIdx: propSelectedVersionIdx,
  onToggleExpanded,
  onVersionSelect,
  onEdit,
  onDelete,
  isNavigatedTo = false,
}: ToolRowProps) {
  const toolRowRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

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
    if (isNavigatedTo && toolRowRef.current && !hasScrolledRef.current) {
      const element = toolRowRef.current;
      hasScrolledRef.current = true;

      // Wait for next animation frame to avoid blocking initial render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (element) {
            element.scrollIntoView({
              behavior: 'auto',
              block: 'center',
              inline: 'nearest',
            });
          }
        });
      });
    }
  }, [isNavigatedTo]);

  // Scroll to expanded tool if it's not in viewport (for click-based expansion)
  useEffect(() => {
    if (isExpanded && !isNavigatedTo && toolRowRef.current) {
      const element = toolRowRef.current;

      // Use minimal timeout to avoid blocking render
      const timeoutId = window.setTimeout(() => {
        if (!element) return;

        // Use getBoundingClientRect only when necessary
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Only scroll if element is truly out of view
        if (rect.bottom > viewportHeight || rect.top < 0) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          });
        }
      }, 0); // Defer until after current call stack clears

      return () => clearTimeout(timeoutId);
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
      className={`card elevation-2 elevation-interactive transition-colors duration-200 ${
        isExpanded ? 'expanded' : 'overflow-hidden'
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
        onEdit={onEdit}
        onDelete={onDelete}
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

export const ToolRow = memo(ToolRowComponent);

// Set display name for better React DevTools debugging
ToolRow.displayName = 'ToolRow';
