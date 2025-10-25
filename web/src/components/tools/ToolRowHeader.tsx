import { Badge } from '../common/Badge';
import { SKRecommendedBadge } from '../common/SKRecommendedBadge';
import type { Tool, ToolVersion } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useRef } from 'react';
import { getButtonClasses } from '../../utils/buttonVariants';

interface ToolRowHeaderProps {
  tool: Tool;
  currentVersion: ToolVersion | undefined;
  selectedVersionIdx: number;
  expanded: boolean;
  onToggleExpanded?: () => void;
  onVersionSelect: (idx: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ToolRowHeader({
  tool,
  currentVersion,
  selectedVersionIdx,
  expanded,
  onToggleExpanded,
  onVersionSelect,
  onEdit,
  onDelete,
}: ToolRowHeaderProps) {
  const { user } = useAuth();
  const versionTabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpanded?.();
    }
  };

  const handleVersionKeyDown = (e: React.KeyboardEvent, idx: number) => {
    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault();
        e.stopPropagation();
        const prevIdx = idx > 0 ? idx - 1 : tool.versions.length - 1;
        onVersionSelect(prevIdx);
        versionTabRefs.current[prevIdx]?.focus();
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        e.stopPropagation();
        const nextIdx = idx < tool.versions.length - 1 ? idx + 1 : 0;
        onVersionSelect(nextIdx);
        versionTabRefs.current[nextIdx]?.focus();
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        e.stopPropagation();
        onVersionSelect(idx);
        break;
      case 'Home':
        e.preventDefault();
        e.stopPropagation();
        onVersionSelect(0);
        versionTabRefs.current[0]?.focus();
        break;
      case 'End': {
        e.preventDefault();
        e.stopPropagation();
        const lastIdx = tool.versions.length - 1;
        onVersionSelect(lastIdx);
        versionTabRefs.current[lastIdx]?.focus();
        break;
      }
    }
  };

  return (
    <div
      className={`p-4 transition-colors duration-150 ${
        onToggleExpanded
          ? 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset'
          : ''
      }`}
      onClick={onToggleExpanded ? onToggleExpanded : undefined}
      onKeyDown={onToggleExpanded ? handleKeyDown : undefined}
      tabIndex={onToggleExpanded ? 0 : undefined}
      role={onToggleExpanded ? 'button' : undefined}
      aria-expanded={onToggleExpanded ? expanded : undefined}
      aria-label={
        onToggleExpanded
          ? `${expanded ? 'Collapse' : 'Expand'} details for ${tool.name}`
          : undefined
      }
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        {/* Left side - Tool info and version tabs */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold flex-shrink-0 text-primary">
              {tool.name}
            </h2>
            {currentVersion?.sk_recommended && (
              <SKRecommendedBadge className="text-xs px-2 py-1 flex-shrink-0">
                <span className="text-xs font-medium">SK Recommended</span>
              </SKRecommendedBadge>
            )}
            {/* Expand/Collapse indicator - only show if expandable */}
            {onToggleExpanded && (
              <div
                className={`ml-2 transition-transform duration-200 text-tertiary ${
                  expanded ? 'rotate-180' : 'rotate-0'
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  focusable="false"
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs mt-0.5 text-secondary">{tool.category}</p>

          {/* Version tabs - moved here for better organization */}
          {tool.versions.length > 1 && (
            <div
              className="flex gap-2 flex-wrap mt-3"
              role="tablist"
              aria-label="Tool versions"
            >
              {tool.versions.map((version, idx) => (
                <button
                  key={`${tool.id}-version-${idx}`}
                  ref={(el) => (versionTabRefs.current[idx] = el)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onVersionSelect(idx);
                  }}
                  onKeyDown={(e) => handleVersionKeyDown(e, idx)}
                  className={`filter-btn text-xs ${
                    selectedVersionIdx === idx
                      ? version.sk_recommended
                        ? 'badge-holographic hover:badge-holographic'
                        : 'filter-btn-active'
                      : version.sk_recommended
                      ? 'badge-holographic hover:badge-holographic'
                      : 'filter-btn-inactive'
                  }`}
                  role="tab"
                  aria-selected={selectedVersionIdx === idx}
                  aria-controls={`tool-${tool.id}-version-${idx}`}
                  tabIndex={selectedVersionIdx === idx ? 0 : -1}
                >
                  {version.versionName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side - Tracking badges and actions */}
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-secondary">GTM:</span>
              <Badge status={currentVersion?.trackables?.gtm?.status || 'Unknown'} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-secondary">Ads:</span>
              <Badge
                status={currentVersion?.trackables?.google_ads?.status || 'Unknown'}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-secondary">GA4:</span>
              <Badge status={currentVersion?.trackables?.ga4?.status || 'Unknown'} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-secondary">MSA:</span>
              <Badge status={currentVersion?.trackables?.msa?.status || 'Unknown'} />
            </div>
          </div>

          {(user?.permissions?.edit || user?.permissions?.delete) && (
            <div className="flex items-center gap-2">
              {user?.permissions?.edit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className={getButtonClasses('default')}
                  aria-label={`Edit ${tool.name}`}
                >
                  Edit
                </button>
              )}
              {user?.permissions?.delete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  className={getButtonClasses('danger')}
                  aria-label={`Delete ${tool.name}`}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
