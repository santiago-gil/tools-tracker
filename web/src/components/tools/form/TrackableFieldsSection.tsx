import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ToolFormData } from '@shared/schemas';
import { TrackableFieldInput } from '../TrackableFieldInput';

interface TrackableFieldsSectionProps {
  register: UseFormRegister<ToolFormData>;
  errors: FieldErrors<ToolFormData>;
  versionIndex: number;
}

const trackableKeys = ['gtm', 'ga4', 'google_ads', 'msa'] as const;
const trackableLabels: Record<(typeof trackableKeys)[number], string> = {
  gtm: 'Google Tag Manager',
  ga4: 'Google Analytics 4',
  google_ads: 'Google Ads',
  msa: 'Microsoft Advertising',
};

export function TrackableFieldsSection({
  register,
  errors,
  versionIndex,
}: TrackableFieldsSectionProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
        Tracking Capabilities
      </h4>

      {trackableKeys.map((key) => (
        <TrackableFieldInput
          key={key}
          trackableKey={key}
          label={trackableLabels[key]}
          register={register}
          errors={errors}
          versionIndex={versionIndex}
        />
      ))}
    </div>
  );
}
