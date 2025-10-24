import type { ToolVersion } from '../../types';

interface VersionMetaSectionProps {
  version: ToolVersion;
  onChange: (version: ToolVersion) => void;
}

export function VersionMetaSection({ version, onChange }: VersionMetaSectionProps) {
  const handleChange = <K extends keyof ToolVersion>(key: K, value: ToolVersion[K]) => {
    onChange({ ...version, [key]: value });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Team Considerations
        </label>
        <textarea
          value={version.team_considerations ?? ''}
          onChange={(e) =>
            handleChange('team_considerations', e.target.value || undefined)
          }
          rows={3}
          className="input-base"
          placeholder="Special considerations for the WCS team"
        />
      </div>

      <div
        onClick={() => handleChange('sk_recommended', !version.sk_recommended)}
        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
          version.sk_recommended
            ? 'badge-holographic'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:badge-holographic'
        }`}
      >
        <input
          type="checkbox"
          id="sk_recommended"
          checked={version.sk_recommended ?? false}
          onChange={(e) => handleChange('sk_recommended', e.target.checked)}
          className="h-5 w-5 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          style={{
            accentColor: version.sk_recommended ? '#8b5cf6' : undefined,
          }}
        />
        <label
          htmlFor="sk_recommended"
          className="ml-3 text-sm font-medium cursor-pointer"
        >
          SK Recommended
        </label>
      </div>
    </div>
  );
}
