import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ToolFormData } from '@shared/schemas';
import { FormField } from '../../common/FormField';

interface BasicInfoSectionProps {
  register: UseFormRegister<ToolFormData>;
  errors: FieldErrors<ToolFormData>;
  categories: string[];
  showCustomCategory: boolean;
  onCategoryChange: (value: string) => void;
  onBackToCategoryList: () => void;
}

export function BasicInfoSection({
  register,
  errors,
  categories,
  showCustomCategory,
  onCategoryChange,
  onBackToCategoryList,
}: BasicInfoSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" required error={errors.name?.message} id="platform-name">
          <input
            {...register('name')}
            className="input-base"
            placeholder="e.g., HubSpot Chat"
            autoComplete="organization"
          />
        </FormField>

        <FormField
          label="Category"
          required
          error={errors.category?.message}
          id={showCustomCategory ? 'category-custom' : 'category-select'}
        >
          {!showCustomCategory ? (
            <select
              {...register('category')}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="input-base"
              autoComplete="organization-title"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__custom__">+ Add new category...</option>
            </select>
          ) : (
            <div className="space-y-2">
              <input
                {...register('category')}
                className="input-base"
                placeholder="Enter new category name..."
                autoFocus
                autoComplete="organization-title"
              />
              <button
                type="button"
                onClick={onBackToCategoryList}
                className="text-sm text-secondary hover:text-primary transition-colors form-text"
              >
                ← Back to category list
              </button>
            </div>
          )}
        </FormField>
      </div>

      <div className="border-t border-[var(--border-light)] pt-4" />
    </>
  );
}
