import type { ToolVersion } from '../../types';
import { sanitizeUrl } from '../../utils/urlValidation';
import { createHtmlId } from '../../utils/htmlId';

interface ExternalLinkProps {
  label: string;
  url: string;
}

function ExternalLink({ label, url }: ExternalLinkProps) {
  const safeUrl = sanitizeUrl(url);

  // Don't render the link at all if the URL is unsafe
  if (!safeUrl) {
    return (
      <div>
        <h5
          className="text-xs font-medium mb-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {label}
        </h5>
        <span className="text-sm text-gray-500 dark:text-gray-400 break-words">
          {url} (unsafe URL)
        </span>
      </div>
    );
  }

  return (
    <div>
      <h5 className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </h5>
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline break-words"
      >
        {url}
        <span className="sr-only"> (opens in new tab)</span>
      </a>
    </div>
  );
}

const TRACKABLE_LABELS: Record<string, string> = {
  gtm: 'Google Tag Manager',
  ga4: 'Google Analytics 4',
  google_ads: 'Google Ads',
  msa: 'Microsoft Advertising',
};

interface ToolRowExpandedProps {
  currentVersion: ToolVersion;
  toolId?: string;
  versionIdx: number;
}

export function ToolRowExpanded({
  currentVersion,
  toolId,
  versionIdx,
}: ToolRowExpandedProps) {
  // Check if there's any content to show
  const hasTeamConsiderations = currentVersion.team_considerations;
  const hasTrackableContent = Object.entries(currentVersion.trackables).some(
    ([, trackable]) =>
      trackable?.notes || trackable?.example_site || trackable?.documentation,
  );

  // Only render if there's actual content
  if (!hasTeamConsiderations && !hasTrackableContent) {
    return (
      <div className="px-4 pb-4 pt-2 text-center">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No additional details available for this tool
        </p>
      </div>
    );
  }

  return (
    <div
      className="px-4 pb-4 pt-2 space-y-3 border-t rounded-b-xl"
      style={{
        borderColor: 'var(--border-light)',
        backgroundColor: 'var(--surface-1)',
      }}
      role="region"
      aria-label="Tool details"
      id={createHtmlId('tool', toolId, 'version', versionIdx.toString()) || undefined}
    >
      {currentVersion.team_considerations && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Web Team Considerations
          </h3>
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
          return (
            <div key={key} className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {TRACKABLE_LABELS[key] || key}
              </h3>

              {trackable?.notes && (
                <div>
                  <h5
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Notes
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {trackable.notes}
                  </p>
                </div>
              )}

              {trackable?.example_site && (
                <ExternalLink label="Example Site" url={trackable.example_site} />
              )}

              {trackable?.documentation && (
                <ExternalLink label="Documentation" url={trackable.documentation} />
              )}
            </div>
          );
        })}
    </div>
  );
}
