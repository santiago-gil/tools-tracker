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
            className="text-xs text-[var(--sk-red)] hover:text-[var(--sk-red-dark)] font-medium"
          >
            + Add
          </button>
        </div>

        <div className="space-y-2">
          {versions.map((version, idx) => (
            <button
              key={idx}
              onClick={() => onSelectVersion(idx)}
              type="button"
              className={`w-full text-left p-3 rounded-lg transition min-h-[80px] elevation-interactive ${
                selectedIndex === idx
                  ? 'elevation-2 border-2 border-[var(--sk-red)]'
                  : 'elevation-1 hover:elevation-2'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {version.versionName}
                  </p>
                  <div className="flex gap-1 mt-2 flex-wrap min-h-[20px]">
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
                    className="text-red-600 hover:text-red-700 text-sm cursor-pointer p-1 rounded hover:bg-red-50"
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
