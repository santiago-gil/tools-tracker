import { useEffect } from 'react';
import { useToolForm } from '../../hooks/useToolForm';
import { FormHeader } from './form/FormHeader';
import { FormFooter } from './form/FormFooter';
import { BasicInfoSection } from './form/BasicInfoSection';
import { VersionFormSection } from './form/VersionFormSection';
import { TrackableFieldsSection } from './form/TrackableFieldsSection';
import { VersionSidebar } from './VersionSidebar';
import type { Tool, ToolVersion } from '../../types';
import type { ToolFormData } from '@shared/schemas';

interface ToolFormModalProps {
  tool?: Tool | null;
  categories: string[];
  onClose: () => void;
  onSubmit: (tool: ToolFormData) => void;
  isSubmitting: boolean;
}

export function ToolFormModal({
  tool,
  categories,
  onClose,
  onSubmit,
  isSubmitting,
}: ToolFormModalProps) {
  const isEditing = !!tool;

  const {
    register,
    handleSubmit,
    errors,
    versions,
    currentVersion,
    selectedVersionIdx,
    setSelectedVersionIdx,
    handleAddVersion,
    handleRemoveVersion,
    showCustomCategory,
    handleCategoryChange,
    handleBackToCategoryList,
    onFormError,
    setValue,
    watch,
    setError,
  } = useToolForm(tool, categories);

  const onFormSubmit = (data: ToolFormData) => {
    // Handle custom category case - check if we're in custom category mode
    if (showCustomCategory) {
      // Get the actual custom category value from the form and trim it once
      const trimmed = (data.category || '').trim();

      // If the custom category field is empty, prevent submission
      if (!trimmed) {
        // Set field error for the category field
        setError('category', {
          type: 'manual',
          message: 'Custom category name is required',
        });

        return; // Prevent submission
      }

      // Assign the trimmed value
      data.category = trimmed;
    }

    // Note: URL sanitization and validation is now handled by the Zod schemas
    // No need for manual sanitization here - the schemas will transform the data
    onSubmit(data);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <FormHeader isEditing={isEditing} onClose={onClose} />

        {/* Form Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar (versions) - only show in edit mode */}
          {isEditing && (
            <VersionSidebar
              versions={versions as ToolVersion[]}
              selectedIndex={selectedVersionIdx}
              onSelectVersion={setSelectedVersionIdx}
              onAddVersion={handleAddVersion}
              onRemoveVersion={handleRemoveVersion}
            />
          )}

          {/* Main Form Area */}
          <form
            onSubmit={handleSubmit(onFormSubmit, onFormError)}
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
          >
            <div className="p-8 space-y-6 flex-1">
              {/* Basic Info Section */}
              <BasicInfoSection
                register={register}
                errors={errors}
                categories={categories}
                showCustomCategory={showCustomCategory}
                onCategoryChange={handleCategoryChange}
                onBackToCategoryList={handleBackToCategoryList}
              />

              {/* Version Form Section */}
              {currentVersion && (
                <>
                  <VersionFormSection
                    version={currentVersion}
                    register={register}
                    errors={errors}
                    versionIndex={selectedVersionIdx}
                    isEditing={isEditing}
                    setValue={setValue}
                    watch={watch}
                  />

                  <TrackableFieldsSection
                    register={register}
                    errors={errors}
                    versionIndex={selectedVersionIdx}
                  />
                </>
              )}
            </div>

            <FormFooter
              isEditing={isEditing}
              isSubmitting={isSubmitting}
              onClose={onClose}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
