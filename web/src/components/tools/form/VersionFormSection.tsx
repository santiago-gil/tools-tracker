import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ToolFormData, VersionFormData } from '../../../lib/validation.js';

interface VersionFormSectionProps {
  version: VersionFormData;
  register: UseFormRegister<ToolFormData>;
  errors: FieldErrors<ToolFormData>;
  versionIndex: number;
  isEditing: boolean;
}

export function VersionFormSection({
  version,
  register,
  errors,
  versionIndex,
  isEditing,
}: VersionFormSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {isEditing ? `Version: ${version.versionName || 'Unnamed'}` : 'Version Details'}
      </h3>

      <div>
        <label
          htmlFor={`version-name-${versionIndex}`}
          className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
        >
          Version Name <span className="text-red-600">*</span>
        </label>
        <input
          id={`version-name-${versionIndex}`}
          {...register(`versions.${versionIndex}.versionName`)}
          className="input-base"
          placeholder="e.g., v1, v2, 2024+, Beta, etc."
        />
        {errors.versions?.[versionIndex]?.versionName && (
          <p className="text-xs text-red-600 mt-1">
            {errors.versions[versionIndex]?.versionName?.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={`sk-recommended-${versionIndex}`}
          className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer w-fit"
          style={{
            backgroundColor: 'var(--badge-recommended-bg)',
            color: 'var(--badge-recommended-text)',
            borderColor: 'var(--badge-recommended-border)',
          }}
        >
          <input
            id={`sk-recommended-${versionIndex}`}
            type="checkbox"
            {...register(`versions.${versionIndex}.sk_recommended`)}
            className="h-5 w-5 rounded"
            style={{
              accentColor: 'var(--badge-recommended-text)',
            }}
          />
          <span className="text-sm font-medium">SK Recommended</span>
        </label>
      </div>

      {/* Web Team Considerations */}
      <div className="border-t pt-4">
        <label
          htmlFor={`team-considerations-${versionIndex}`}
          className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
        >
          Web Team Considerations
        </label>
        <textarea
          id={`team-considerations-${versionIndex}`}
          {...register(`versions.${versionIndex}.team_considerations`)}
          rows={3}
          className="input-base"
          placeholder="Special implementation notes..."
        />
      </div>
    </div>
  );
}
