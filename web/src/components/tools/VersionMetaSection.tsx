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

      <div className="flex items-center p-4 border rounded-lg badge-holographic">
        <input
          type="checkbox"
          id="sk_recommended"
          checked={version.sk_recommended ?? false}
          onChange={(e) => handleChange('sk_recommended', e.target.checked)}
          className="h-5 w-5 text-white focus:ring-white border-white/50 rounded cursor-pointer"
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
