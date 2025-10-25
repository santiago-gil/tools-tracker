import { useMemo } from 'react';
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

export function VersionSidebar({
  versions,
  selectedIndex,
  onSelectVersion,
  onAddVersion,
  onRemoveVersion,
}: VersionSidebarProps) {
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
    <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Versions
          </h3>
          <button
            type="button"
            onClick={onAddVersion}
            className="filter-btn filter-btn-inactive text-xs px-2 py-1"
          >
            + Add
          </button>
        </div>

        <div className="space-y-2">
          {versions.map((version, idx) => (
            <button
              key={versionKeys[idx]}
              onClick={() => onSelectVersion(idx)}
              type="button"
              className={`w-full text-left p-2 rounded-lg transition-all duration-200 min-h-[60px] elevation-1 ${
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                    {version.versionName}
                  </p>
                  <div className="grid grid-cols-2 gap-1 min-h-[16px]">
                    {(() => {
                      const analysis = trackablesAnalysis[idx];

                      if (analysis.meaningful.length === 0) {
                        if (analysis.unknown.length > 0) {
                          return (
                            <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400 italic">
                              Service status unknown
                            </div>
                          );
                        } else {
                          return (
                            <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400 italic">
                              No service status configured
                            </div>
                          );
                        }
                      }

                      return analysis.meaningful.map((trackable) => (
                        <div key={trackable.key} className="flex items-center gap-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
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
                    ✕
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
