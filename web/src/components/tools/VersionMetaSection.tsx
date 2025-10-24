import type { ToolVersion } from '../../types';
import { SKRecommendedBadge } from '../common/SKRecommendedBadge';

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

      <SKRecommendedBadge
        isRecommended={version.sk_recommended}
        onClick={() => handleChange('sk_recommended', !version.sk_recommended)}
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
      </SKRecommendedBadge>
    </div>
  );
}
