import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ToolFormData } from '../../../lib/validation.js';
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
        <FormField
          label="Platform Name"
          required
          error={errors.name?.message}
          id="platform-name"
        >
          <input
            {...register('name')}
            className="input-base"
            placeholder="e.g., HubSpot Chat"
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
              />
              <button
                type="button"
                onClick={onBackToCategoryList}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                ← Back to category list
              </button>
            </div>
          )}
        </FormField>
      </div>

      <div className="border-t pt-4" />
    </>
  );
}
