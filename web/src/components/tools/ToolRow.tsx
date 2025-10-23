import { useState } from 'react';
import { Badge } from '../common/Badge';
import type { Tool } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface ToolRowProps {
  tool: Tool;
  onEdit: () => void;
  onDelete: () => void;
}

export function ToolRow({ tool, onEdit, onDelete }: ToolRowProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);

  // Safety check for versions array
  if (!tool.versions || tool.versions.length === 0) {
    return (
      <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
        <div className="text-gray-500 dark:text-gray-400">
          No versions available for {tool.name}
        </div>
      </div>
    );
  }

  const currentVersion = tool.versions[selectedVersionIdx];

  return (
    <div className="card elevation-2 elevation-interactive overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          {/* Left side - Tool info and version tabs */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-shrink-0">
                {tool.name}
              </h3>
              {currentVersion?.sk_recommended && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--badge-recommended-bg)',
                    color: 'var(--badge-recommended-text)',
                    borderColor: 'var(--badge-recommended-border)',
                  }}
                >
                  SK Recommended
                </span>
              )}
              {/* Expand/Collapse indicator */}
              <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">
                {expanded ? '▲' : '▼'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              {tool.category}
            </p>

            {/* Version tabs - moved here for better organization */}
            {tool.versions.length > 1 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {tool.versions.map((version, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVersionIdx(idx);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-md transition font-medium ${
                      selectedVersionIdx === idx
                        ? 'btn-primary text-xs'
                        : 'btn-secondary text-xs'
                    }`}
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
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  GTM:
                </span>
                <Badge status={currentVersion?.trackables?.gtm?.status || 'Unknown'} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  Ads:
                </span>
                <Badge
                  status={currentVersion?.trackables?.google_ads?.status || 'Unknown'}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  GA4:
                </span>
                <Badge status={currentVersion?.trackables?.ga4?.status || 'Unknown'} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  MSA:
                </span>
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
                    className="text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:underline font-medium"
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
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && currentVersion && (
        <div
          className="px-4 pb-4 pt-2 space-y-3 border-t elevation-1"
          style={{ borderColor: 'var(--border-light)' }}
        >
          {currentVersion.team_considerations && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Web Team Considerations
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {currentVersion.team_considerations}
              </p>
            </div>
          )}

          {Object.entries(currentVersion.trackables)
            .filter(
              ([, trackable]) =>
                trackable?.notes || trackable?.example_site || trackable?.documentation,
            )
            .map(([key, trackable]) => {
              const labels: Record<string, string> = {
                gtm: 'Google Tag Manager',
                ga4: 'Google Analytics 4',
                google_ads: 'Google Ads',
                msa: 'Microsoft Advertising',
              };
              return (
                <div key={key} className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {labels[key] || key}
                  </h4>

                  {trackable?.notes && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Notes
                      </h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {trackable.notes}
                      </p>
                    </div>
                  )}

                  {trackable?.example_site && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Example Site
                      </h5>
                      <a
                        href={trackable.example_site}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline break-all"
                      >
                        {trackable.example_site}
                      </a>
                    </div>
                  )}

                  {trackable?.documentation && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Documentation
                      </h5>
                      <a
                        href={trackable.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline break-all"
                      >
                        {trackable.documentation}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
