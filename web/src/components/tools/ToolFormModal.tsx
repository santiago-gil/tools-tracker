import { useEffect } from 'react';
import { useToolForm } from '../../hooks/useToolForm';
import { FormHeader } from './form/FormHeader';
import { FormFooter } from './form/FormFooter';
import { BasicInfoSection } from './form/BasicInfoSection';
import { VersionFormSection } from './form/VersionFormSection';
import { TrackableFieldsSection } from './form/TrackableFieldsSection';
import { VersionSidebar } from './VersionSidebar';
import type { Tool } from '../../types';

interface ToolFormModalProps {
  tool?: Tool | null;
  categories: string[];
  onClose: () => void;
  onSubmit: (tool: Partial<Tool>) => void;
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
  } = useToolForm(tool, categories);

  const onFormSubmit = (data: Partial<Tool>) => {
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
                  />

                  <TrackableFieldsSection
                    register={register}
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
