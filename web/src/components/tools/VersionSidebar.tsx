import { useMemo } from 'react';
import { Badge } from '../common/Badge';
import type { ToolVersion } from '../../types';

interface VersionSidebarProps {
  versions: ToolVersion[];
  selectedIndex: number;
  onSelectVersion: (index: number) => void;
  onAddVersion: () => void;
  onRemoveVersion: (index: number) => void;
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
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 min-h-[80px] elevation-1 ${
                selectedIndex === idx
                  ? version.sk_recommended
                    ? 'badge-holographic hover:badge-holographic'
                    : 'ring-2 ring-[var(--sk-red)] ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-800'
                  : version.sk_recommended
                  ? 'badge-holographic hover:badge-holographic'
                  : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600 hover:ring-offset-1 hover:ring-offset-gray-50 dark:hover:ring-offset-gray-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-2">
                    {version.versionName}
                  </p>
                  <div className="flex gap-1 flex-wrap min-h-[20px]">
                    {Object.entries(version.trackables)
                      .filter(([, value]: [string, unknown]) => value)
                      .map(([key, trackable]) => (
                        <Badge
                          key={key}
                          status={trackable?.status || 'Unknown'}
                          compact
                        />
                      ))}
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
