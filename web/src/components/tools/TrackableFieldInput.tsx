import type { UseFormRegister } from 'react-hook-form';
import type { ToolFormData } from '../../lib/validation.js';
import { TRACKABLE_STATUSES } from '../../types';

interface TrackableFieldInputProps {
  trackableKey: 'gtm' | 'ga4' | 'google_ads' | 'msa';
  label: string;
  register: UseFormRegister<ToolFormData>;
  versionIndex: number;
}

export function TrackableFieldInput({
  trackableKey,
  label,
  register,
  versionIndex,
}: TrackableFieldInputProps) {
  const statusKey = `versions.${versionIndex}.trackables.${trackableKey}.status` as const;
  const notesKey = `versions.${versionIndex}.trackables.${trackableKey}.notes` as const;
  const exampleSiteKey =
    `versions.${versionIndex}.trackables.${trackableKey}.example_site` as const;
  const docKey =
    `versions.${versionIndex}.trackables.${trackableKey}.documentation` as const;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`${trackableKey}-status-${versionIndex}`}
            className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
          >
            {label} <span className="text-red-600">*</span>
          </label>
          <select
            id={`${trackableKey}-status-${versionIndex}`}
            {...register(statusKey)}
            className="input-base"
          >
            {TRACKABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`${trackableKey}-notes-${versionIndex}`}
            className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
          >
            Notes
          </label>
          <input
            id={`${trackableKey}-notes-${versionIndex}`}
            type="text"
            {...register(notesKey)}
            className="input-base"
            placeholder="Optional implementation notes"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`${trackableKey}-example-${versionIndex}`}
            className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
          >
            Example Site
          </label>
          <input
            id={`${trackableKey}-example-${versionIndex}`}
            type="text"
            {...register(exampleSiteKey)}
            className="input-base"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label
            htmlFor={`${trackableKey}-docs-${versionIndex}`}
            className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
          >
            Documentation Link
          </label>
          <input
            id={`${trackableKey}-docs-${versionIndex}`}
            type="text"
            {...register(docKey)}
            className="input-base"
            placeholder="https://docs.example.com"
          />
        </div>
      </div>
    </div>
  );
}
