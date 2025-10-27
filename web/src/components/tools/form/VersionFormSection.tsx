import type {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import type { ToolFormData, VersionFormData } from '@shared/schemas';
import { FormField } from '../../common/FormField';
import { SKRecommendedBadge } from '../../common/SKRecommendedBadge';

interface VersionFormSectionProps {
  version: VersionFormData;
  register: UseFormRegister<ToolFormData>;
  errors: FieldErrors<ToolFormData>;
  versionIndex: number;
  isEditing: boolean;
  setValue: UseFormSetValue<ToolFormData>;
  watch: UseFormWatch<ToolFormData>;
}

export function VersionFormSection({
  version,
  register,
  errors,
  versionIndex,
  isEditing,
  setValue,
  watch,
}: VersionFormSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary">
        {isEditing ? `Version: ${version.versionName || 'Unnamed'}` : 'Version Details'}
      </h3>

      <FormField
        label="Version Name"
        required
        error={errors.versions?.[versionIndex]?.versionName?.message}
        id={`version-name-${versionIndex}`}
      >
        <input
          {...register(`versions.${versionIndex}.versionName`)}
          className="input-base"
          placeholder="e.g., v1, v2, 2024+, Beta, etc."
          autoComplete="off"
        />
      </FormField>

      <SKRecommendedBadge
        isRecommended={watch(`versions.${versionIndex}.sk_recommended`) ?? false}
      >
        <input
          id={`sk-recommended-${versionIndex}`}
          type="checkbox"
          checked={watch(`versions.${versionIndex}.sk_recommended`) ?? false}
          onChange={(e) =>
            setValue(`versions.${versionIndex}.sk_recommended`, e.target.checked)
          }
          className="custom-checkbox"
        />
        <span className="ml-3 text-sm font-medium">SK Recommended</span>
      </SKRecommendedBadge>

      {/* Web Team Considerations */}
      <div className="border-t border-[var(--border-light)] pt-4">
        <FormField
          label="Web Team Considerations"
          error={errors.versions?.[versionIndex]?.team_considerations?.message}
          id={`team-considerations-${versionIndex}`}
        >
          <textarea
            {...register(`versions.${versionIndex}.team_considerations`)}
            rows={3}
            className="input-base"
            placeholder="Special implementation notes..."
          />
        </FormField>
      </div>
    </div>
  );
}
