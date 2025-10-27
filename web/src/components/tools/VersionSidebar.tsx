import React, { useMemo } from 'react';
import { FilePlus2, X } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { ToolVersion, TrackableStatus } from '../../types';

interface VersionSidebarProps {
  versions: ToolVersion[];
  selectedIndex: number;
  onSelectVersion: (index: number) => void;
  onAddVersion: () => void;
  onRemoveVersion: (index: number) => void;
}

interface ProcessedTrackable {
  key: string;
  label: string;
  status: TrackableStatus;
}

interface TrackablesAnalysis {
  meaningful: ProcessedTrackable[];
  unknown: ProcessedTrackable[];
  hasAny: boolean;
}

const VersionSidebarComponent = ({
  versions,
  selectedIndex,
  onSelectVersion,
  onAddVersion,
  onRemoveVersion,
}: VersionSidebarProps): JSX.Element => {
  // Create stable keys for versions based on versionName and index
  const versionKeys = useMemo(() => {
    return versions.map(
      (version, idx) =>
        `version-${idx}-${version.versionName.replace(/[^a-zA-Z0-9]/g, '-')}`,
    );
  }, [versions]);

  // Memoized trackables processing logic
  const trackablesAnalysis = useMemo(() => {
    const analysis: Record<number, TrackablesAnalysis> = {};

    versions.forEach((version, idx) => {
      const labels: Record<string, string> = {
        gtm: 'GTM',
        google_ads: 'Ads',
        ga4: 'GA4',
        msa: 'MSA',
      };

      const meaningful: ProcessedTrackable[] = [];
      const unknown: ProcessedTrackable[] = [];

      Object.entries(version.trackables).forEach(([key, trackable]) => {
        if (trackable && trackable.status) {
          const processed: ProcessedTrackable = {
            key,
            label: labels[key] || key.toUpperCase(),
            status: trackable.status,
          };

          if (trackable.status === 'Unknown') {
            unknown.push(processed);
          } else {
            meaningful.push(processed);
          }
        }
      });

      analysis[idx] = {
        meaningful,
        unknown,
        hasAny: meaningful.length > 0 || unknown.length > 0,
      };
    });

    return analysis;
  }, [versions]);

  return (
    <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-800 border-b md:border-b-0 md:border-r border-[var(--border-light)] p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">Versions</h3>
          <button
            type="button"
            onClick={onAddVersion}
            className="filter-btn filter-btn-inactive text-xs px-2 py-1 flex items-center gap-1"
            title="Add Version"
            aria-label="Add Version"
          >
            <FilePlus2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {versions.map((version, idx) => (
            <button
              key={versionKeys[idx]}
              onClick={() => onSelectVersion(idx)}
              type="button"
              className={`w-full text-left p-2 rounded-lg transition-colors duration-200 min-h-[60px] elevation-1 ${
                selectedIndex === idx
                  ? version.sk_recommended
                    ? 'badge-holographic border-2 border-[var(--sk-red)] shadow-lg shadow-purple-200 dark:shadow-purple-900/50'
                    : 'border-2 border-[var(--sk-red)]'
                  : version.sk_recommended
                    ? 'badge-holographic hover:badge-holographic'
                    : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600 hover:ring-offset-1 hover:ring-offset-gray-50 dark:hover:ring-offset-gray-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate mb-1">
                    {version.versionName}
                  </p>
                  <div className="grid grid-cols-2 gap-1 min-h-[16px]">
                    {(() => {
                      const analysis = trackablesAnalysis[idx];

                      if (analysis.meaningful.length === 0) {
                        if (analysis.unknown.length > 0) {
                          return (
                            <div className="col-span-2 text-xs text-tertiary italic">
                              Service status unknown
                            </div>
                          );
                        } else {
                          return (
                            <div className="col-span-2 text-xs text-tertiary italic">
                              No service status configured
                            </div>
                          );
                        }
                      }

                      return analysis.meaningful.map((trackable) => (
                        <div key={trackable.key} className="flex items-center gap-1">
                          <span className="text-xs font-medium text-secondary">
                            {trackable.label}:
                          </span>
                          <Badge status={trackable.status} compact />
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                {versions.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveVersion(idx);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm cursor-pointer p-1 rounded hover:underline"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveVersion(idx);
                      }
                    }}
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to safely compare trackables objects
// Compares only the status field for each trackable key
function compareTrackables(
  prev: ToolVersion['trackables'],
  next: ToolVersion['trackables'],
): boolean {
  // Derive the set of keys dynamically from both prev and next
  const prevKeys = Object.keys(prev || {}) as Array<keyof typeof prev>;
  const nextKeys = Object.keys(next || {}) as Array<keyof typeof next>;
  const allKeys = Array.from(new Set([...prevKeys, ...nextKeys]));

  // Compare status for each key, treating missing entries as undefined
  for (const key of allKeys) {
    const prevStatus = prev?.[key]?.status;
    const nextStatus = next?.[key]?.status;

    if (prevStatus !== nextStatus) {
      return false;
    }
  }

  return true;
}

export const VersionSidebar = React.memo(
  VersionSidebarComponent,
  (prevProps, nextProps) => {
    // Custom comparison function
    // Note: Callback props (onSelectVersion, onAddVersion, onRemoveVersion) should be
    // memoized in the parent component using useCallback for optimal re-render prevention
    const callbacksEqual =
      prevProps.onSelectVersion === nextProps.onSelectVersion &&
      prevProps.onAddVersion === nextProps.onAddVersion &&
      prevProps.onRemoveVersion === nextProps.onRemoveVersion;

    if (!callbacksEqual) {
      return false;
    }

    const selectedIndexEqual = prevProps.selectedIndex === nextProps.selectedIndex;

    if (!selectedIndexEqual) {
      return false;
    }

    if (prevProps.versions.length !== nextProps.versions.length) {
      return false;
    }

    return prevProps.versions.every((v, idx) => {
      const nextVersion = nextProps.versions[idx];
      if (!nextVersion) {
        return false;
      }

      const basicPropsEqual =
        v.versionName === nextVersion.versionName &&
        v.sk_recommended === nextVersion.sk_recommended;

      if (!basicPropsEqual) {
        return false;
      }

      return compareTrackables(v.trackables, nextVersion.trackables);
    });
  },
);
