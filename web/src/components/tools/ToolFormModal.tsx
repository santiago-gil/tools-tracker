import { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toolFormSchema, type ToolFormData } from '../../lib/validation';
import { TrackableFieldInput } from './TrackableFieldInput';
import { VersionSidebar } from './VersionSidebar';
import type { Tool, ToolVersion } from '../../types';

interface ToolFormModalProps {
  tool?: Tool | null;
  categories: string[];
  onClose: () => void;
  onSubmit: (tool: Partial<Tool>) => void;
  isSubmitting: boolean;
}

const DEFAULT_VERSION: ToolVersion = {
  versionName: 'v1',
  trackables: {
    gtm: {
      status: 'Unknown',
      notes: '',
      example_site: '',
      documentation: '',
    },
    ga4: {
      status: 'Unknown',
      notes: '',
      example_site: '',
      documentation: '',
    },
    google_ads: {
      status: 'Unknown',
      notes: '',
      example_site: '',
      documentation: '',
    },
    msa: {
      status: 'Unknown',
      notes: '',
      example_site: '',
      documentation: '',
    },
  },
  sk_recommended: false,
};

const createEmptyVersion = (): ToolVersion => ({
  versionName: '',
  trackables: {
    gtm: {
      status: 'Unknown',
      notes: '',
      example_site: '',
      documentation: '',
    },
    ga4: {
      status: 'Unknown',
      notes: '',
      example_site: '',
      documentation: '',
    },
    google_ads: {
      status: 'Unknown',
      notes: '',
      example_site: '',
      documentation: '',
    },
    msa: {
      status: 'Unknown',
      notes: '',
      example_site: '',
      documentation: '',
    },
  },
  sk_recommended: false,
  team_considerations: '',
});

// Helper function to convert various date formats to ISO string
const convertToDateString = (dateValue: unknown): string => {
  if (typeof dateValue === 'string') {
    return dateValue;
  }

  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }

  // Handle Firestore Timestamp objects or other date-like objects
  if (dateValue && typeof dateValue === 'object') {
    const obj = dateValue as Record<string, unknown>;

    // Check if it's a Firestore Timestamp
    if (obj.toDate && typeof obj.toDate === 'function') {
      return (obj.toDate as () => Date)().toISOString();
    }

    // Check if it has a seconds property (Firestore Timestamp)
    if (typeof obj.seconds === 'number') {
      return new Date(obj.seconds * 1000).toISOString();
    }

    // Try to create a Date from the value
    try {
      const date = new Date(String(dateValue));
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      console.warn('Could not convert date value:', dateValue);
    }
  }

  // Fallback: return the value as string or empty string
  return String(dateValue || '');
};

export function ToolFormModal({
  tool,
  categories,
  onClose,
  onSubmit,
  isSubmitting,
}: ToolFormModalProps) {
  const isEditing = !!tool;
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
  } = useForm<ToolFormData>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: tool
      ? {
          name: tool.name,
          category: tool.category,
          versions: tool.versions,
          // Convert various date formats to strings for form validation
          createdAt: tool.createdAt ? convertToDateString(tool.createdAt) : undefined,
          updatedAt: tool.updatedAt ? convertToDateString(tool.updatedAt) : undefined,
          updatedBy: tool.updatedBy,
        }
      : {
          name: '',
          category: categories[0] ?? '',
          versions: [DEFAULT_VERSION],
        },
  });

  const versions = watch('versions');
  const currentVersion = versions[selectedVersionIdx];

  const handleAddVersion = () => {
    // Create a completely clean version with all fields reset to default values
    const newVersion = createEmptyVersion();

    // Add the new version to the form
    setValue('versions', [...versions, newVersion]);
    setSelectedVersionIdx(versions.length);

    // Clear any form errors to start fresh with the new version
    clearErrors();
  };

  const handleRemoveVersion = (idx: number) => {
    if (versions.length > 1) {
      const updated = versions.filter((_, i) => i !== idx);
      setValue('versions', updated);
      if (selectedVersionIdx >= updated.length) {
        setSelectedVersionIdx(updated.length - 1);
      }
    }
  };

  const onFormSubmit = (data: ToolFormData) => {
    onSubmit(data);
  };

  const onFormError = (errors: FieldErrors<ToolFormData>) => {
    console.error('Form validation errors:', errors);
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomCategory(true);
      setValue('category', '');
      // Clear any validation errors when switching to custom
      clearErrors('category');
    } else {
      setShowCustomCategory(false);
      setValue('category', value);
    }
  };

  const trackableKeys = ['gtm', 'ga4', 'google_ads', 'msa'] as const;
  const trackableLabels: Record<(typeof trackableKeys)[number], string> = {
    gtm: 'Google Tag Manager',
    ga4: 'Google Analytics 4',
    google_ads: 'Google Ads',
    msa: 'Microsoft Advertising',
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Tool' : 'Add New Tool'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar (versions) - only show in edit mode */}
          {isEditing && (
            <VersionSidebar
              versions={versions}
              selectedIndex={selectedVersionIdx}
              onSelectVersion={setSelectedVersionIdx}
              onAddVersion={handleAddVersion}
              onRemoveVersion={handleRemoveVersion}
            />
          )}

          {/* Main Form Area */}
          <form
            onSubmit={handleSubmit(onFormSubmit, onFormError)}
            className="flex-1 flex flex-col overflow-y-auto"
          >
            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              {/* Basic Info - always show name and category fields */}
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
                        onChange={(e) => handleCategoryChange(e.target.value)}
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
                          onClick={() => {
                            setShowCustomCategory(false);
                            setValue('category', '');
                            clearErrors('category');
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          ← Back to category list
                        </button>
                      </div>
                    )}
                    {errors.category && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4" />
              </>

              {/* Version Form */}
              {currentVersion && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isEditing
                        ? `Version: ${currentVersion.versionName || 'Unnamed'}`
                        : 'Version Details'}
                    </h3>

                    <div>
                      <label
                        htmlFor={`version-name-${selectedVersionIdx}`}
                        className="block text-sm font-medium text-gray-900 mb-1"
                      >
                        Version Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        id={`version-name-${selectedVersionIdx}`}
                        {...register(`versions.${selectedVersionIdx}.versionName`)}
                        className="input-base"
                        placeholder="e.g., v1, v2, 2024+, Beta, etc."
                      />
                      {errors.versions?.[selectedVersionIdx]?.versionName && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.versions[selectedVersionIdx]?.versionName?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`sk-recommended-${selectedVersionIdx}`}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer w-fit"
                      >
                        <input
                          id={`sk-recommended-${selectedVersionIdx}`}
                          type="checkbox"
                          {...register(`versions.${selectedVersionIdx}.sk_recommended`)}
                          className="h-5 w-5 rounded"
                        />
                        <span className="text-sm font-medium text-purple-700">
                          SK Recommended
                        </span>
                      </label>
                    </div>

                    {/* Tracking Capabilities */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-base font-semibold text-gray-900">
                        Tracking Capabilities
                      </h4>

                      {trackableKeys.map((key) => (
                        <TrackableFieldInput
                          key={key}
                          trackableKey={key}
                          label={trackableLabels[key]}
                          register={register}
                          versionIndex={selectedVersionIdx}
                        />
                      ))}
                    </div>

                    {/* Web Team Considerations */}
                    <div className="border-t pt-4">
                      <label
                        htmlFor={`team-considerations-${selectedVersionIdx}`}
                        className="block text-sm font-medium text-gray-900 mb-1"
                      >
                        Web Team Considerations
                      </label>
                      <textarea
                        id={`team-considerations-${selectedVersionIdx}`}
                        {...register(
                          `versions.${selectedVersionIdx}.team_considerations`,
                        )}
                        rows={3}
                        className="input-base"
                        placeholder="Special implementation notes..."
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 p-8 border-t border-gray-200 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Tool'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
