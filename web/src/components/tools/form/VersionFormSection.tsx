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
          onClick={() => {
            const currentValue = version.sk_recommended;
            // This will trigger the form's onChange handler
            const event = new Event('change', { bubbles: true });
            const input = document.getElementById(
              `sk-recommended-${versionIndex}`,
            ) as HTMLInputElement;
            if (input) {
              input.checked = !currentValue;
              input.dispatchEvent(event);
            }
          }}
          className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer w-fit transition-all duration-200 ${
            version.sk_recommended
              ? 'badge-holographic'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:badge-holographic'
          }`}
        >
          <input
            id={`sk-recommended-${versionIndex}`}
            type="checkbox"
            {...register(`versions.${versionIndex}.sk_recommended`)}
            className="h-5 w-5 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{
              accentColor: version.sk_recommended ? '#8b5cf6' : undefined,
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
