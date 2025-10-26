import { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ToolFormSchema, type ToolFormData } from '@shared/schemas';
import type { Tool, ToolVersion } from '../types';
import { createEmptyTrackables } from '../utils/trackableFields';

const DEFAULT_VERSION: ToolVersion = {
    versionName: 'v1',
    trackables: createEmptyTrackables(),
    sk_recommended: false,
};

const createEmptyVersion = (): ToolVersion => ({
    versionName: '',
    trackables: createEmptyTrackables(),
    sk_recommended: false,
    team_considerations: '',
});

// Date conversion is now handled by the backend

export function useToolForm(tool?: Tool | null, categories: string[] = []) {
    const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
    const [showCustomCategory, setShowCustomCategory] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        clearErrors,
        setError,
    } = useForm<ToolFormData>({
        resolver: zodResolver(ToolFormSchema),
        defaultValues: tool
            ? {
                name: tool.name,
                category: tool.category,
                versions: tool.versions,
            }
            : {
                name: '',
                category: categories[0] ?? '',
                versions: [DEFAULT_VERSION],
            },
    });

    const versions = watch('versions') as ToolFormData['versions'];
    const currentVersion = versions[selectedVersionIdx] as ToolFormData['versions'][0];

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
            const versionToDelete = versions[idx];
            const confirmMessage = `Are you sure you want to delete version "${versionToDelete.versionName}"? This action cannot be undone.`;

            if (confirm(confirmMessage)) {
                const updated = versions.filter((_: ToolFormData['versions'][0], i: number) => i !== idx);
                setValue('versions', updated);
                if (selectedVersionIdx >= updated.length) {
                    setSelectedVersionIdx(updated.length - 1);
                }
            }
        }
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
            // Clear any validation errors when selecting a valid category
            clearErrors('category');
        }
    };

    const handleBackToCategoryList = () => {
        setShowCustomCategory(false);
        setValue('category', '');
        clearErrors('category');
    };

    const onFormError = (errors: FieldErrors<ToolFormData>) => {
        // Form validation errors are handled by field-level error display
        // Development-only logging for debugging validation issues
        if (import.meta.env.DEV) {
            console.debug('Form validation errors:', errors);
        }
    };

    return {
        // Form state
        register,
        handleSubmit,
        errors,
        watch,
        setValue,
        clearErrors,
        setError,

        // Version management
        versions,
        currentVersion,
        selectedVersionIdx,
        setSelectedVersionIdx,
        handleAddVersion,
        handleRemoveVersion,

        // Category management
        showCustomCategory,
        handleCategoryChange,
        handleBackToCategoryList,

        // Form handlers
        onFormError,
    };
}
