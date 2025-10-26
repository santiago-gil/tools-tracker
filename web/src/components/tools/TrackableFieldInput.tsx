import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ToolFormData } from '@shared/schemas';
import { TRACKABLE_STATUSES } from '../../types';
import { FormField } from '../common/FormField';

interface TrackableFieldInputProps {
  trackableKey: 'gtm' | 'ga4' | 'google_ads' | 'msa';
  label: string;
  register: UseFormRegister<ToolFormData>;
  errors: FieldErrors<ToolFormData>;
  versionIndex: number;
}

export function TrackableFieldInput({
  trackableKey,
  label,
  register,
  errors,
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
        <FormField label={label} required id={`${trackableKey}-status-${versionIndex}`}>
          <select {...register(statusKey)} className="input-base">
            {TRACKABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Notes" id={`${trackableKey}-notes-${versionIndex}`}>
          <input
            type="text"
            {...register(notesKey)}
            className="input-base"
            placeholder="Optional implementation notes"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Example Site"
          error={
            errors.versions?.[versionIndex]?.trackables?.[trackableKey]?.example_site
              ?.message
          }
          id={`${trackableKey}-example-${versionIndex}`}
        >
          <input
            type="url"
            {...register(exampleSiteKey)}
            className="input-base"
            placeholder="https://example.com"
          />
        </FormField>

        <FormField
          label="Documentation Link"
          error={
            errors.versions?.[versionIndex]?.trackables?.[trackableKey]?.documentation
              ?.message
          }
          id={`${trackableKey}-docs-${versionIndex}`}
        >
          <input
            type="url"
            {...register(docKey)}
            className="input-base"
            placeholder="https://docs.example.com"
          />
        </FormField>
      </div>
    </div>
  );
}
