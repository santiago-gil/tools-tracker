import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { ToolFormData } from '../../../lib/validation.js';

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
        <div>
          <label
            htmlFor="platform-name"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Platform Name <span className="text-red-600">*</span>
          </label>
          <input
            id="platform-name"
            {...register('name')}
            className="input-base"
            placeholder="e.g., HubSpot Chat"
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="category-select"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Category <span className="text-red-600">*</span>
          </label>
          {!showCustomCategory ? (
            <select
              id="category-select"
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
                id="category-custom"
                {...register('category')}
                className="input-base"
                placeholder="Enter new category name..."
                autoFocus
              />
              <button
                type="button"
                onClick={onBackToCategoryList}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to category list
              </button>
            </div>
          )}
          {errors.category && (
            <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>
          )}
        </div>
      </div>

      <div className="border-t pt-4" />
    </>
  );
}
