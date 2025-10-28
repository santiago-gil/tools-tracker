import { useState, useEffect, useCallback } from 'react';
import { useForm, type FieldErrors, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ToolFormSchema, type ToolFormData } from '@shared/schemas';
import type { Tool, ToolVersion } from '../types';
import { createEmptyTrackables } from '../utils/trackableFields';

const DEFAULT_VERSION: ToolVersion = {
    versionName: 'v1',
    trackables: createEmptyTrackables(),
    sk_recommended: false,
    team_considerations: '',
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
    const [formVersion, setFormVersion] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        clearErrors,
        setError,
        getValues,
        reset,
        control,
    } = useForm<ToolFormData>({
        resolver: zodResolver(ToolFormSchema),
        defaultValues: tool
            ? {
                name: tool.name,
                category: tool.category,
                versions: tool.versions.map(v => ({
                    ...v,
                    team_considerations: v.team_considerations ?? '',
                })),
            }
            : {
                name: '',
                category: categories[0] ?? '',
                versions: [DEFAULT_VERSION],
            },
    });

    // Use useWatch to ensure re-renders when nested fields change
    const versions = useWatch({ control, name: 'versions' }) as ToolFormData['versions'];
    const currentVersion = versions[selectedVersionIdx] as ToolFormData['versions'][0];

    // Increment form version when selected version index changes
    useEffect(() => {
        setFormVersion(v => v + 1);
    }, [selectedVersionIdx]);

    // Initialize form when tool changes
    useEffect(() => {
        if (tool && tool.id !== undefined) {
            // Only reset form if this is a different tool or versions changed
            const currentVersions = getValues('versions');
            const versionsChanged =
                !currentVersions ||
                currentVersions.length !== tool.versions.length ||
                currentVersions.some((v, idx) => v.versionName !== tool.versions[idx]?.versionName);

            if (versionsChanged) {
                reset({
                    name: tool.name,
                    category: tool.category,
                    versions: tool.versions.map(v => ({
                        ...v,
                        team_considerations: v.team_considerations ?? '',
                    })),
                });
            }
        }
    }, [tool, reset, getValues]); // Include tool to properly track all changes

    // Handle version switching - just update index, form handles the rest
    const handleVersionSwitch = useCallback((newIdx: number) => {
        // If switching to the same version, do nothing
        if (selectedVersionIdx === newIdx) {
            return;
        }

        // Just update the selected index - watch() will update currentVersion automatically
        setSelectedVersionIdx(newIdx);
    }, [selectedVersionIdx, setSelectedVersionIdx]);

    const handleAddVersion = useCallback(() => {
        // Get the current versions from the form state using getValues to avoid unnecessary re-renders
        const currentVersions = getValues('versions');

        // Create a completely clean version with all fields reset to default values
        const newVersion = createEmptyVersion();
        const newIdx = currentVersions.length;

        // Add the new version to the form using the current versions
        setValue('versions', [...currentVersions, newVersion], { shouldDirty: true });

        setSelectedVersionIdx(newIdx);

        // Clear any form errors to start fresh with the new version
        clearErrors();
    }, [getValues, setValue, setSelectedVersionIdx, clearErrors]);

    const handleRemoveVersion = useCallback((idx: number) => {
        // Get current versions from form state to avoid stale closure
        const currentVersions = getValues('versions');

        if (currentVersions.length > 1) {
            const versionToDelete = currentVersions[idx];
            const confirmMessage = `Are you sure you want to delete version "${versionToDelete.versionName}"? This action cannot be undone.`;

            if (confirm(confirmMessage)) {
                const updated = currentVersions.filter((_: ToolFormData['versions'][0], i: number) => i !== idx);

                setValue('versions', updated, { shouldDirty: true });
                if (selectedVersionIdx >= updated.length) {
                    setSelectedVersionIdx(updated.length - 1);
                }
            }
        }
    }, [getValues, selectedVersionIdx, setValue, setSelectedVersionIdx]);

    const handleCategoryChange = useCallback((value: string) => {
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
    }, [setValue, clearErrors]);

    const handleBackToCategoryList = useCallback(() => {
        setShowCustomCategory(false);
        setValue('category', '');
        clearErrors('category');
    }, [setValue, clearErrors]);

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
        setSelectedVersionIdx: handleVersionSwitch,
        handleAddVersion,
        handleRemoveVersion,

        // Category management
        showCustomCategory,
        handleCategoryChange,
        handleBackToCategoryList,

        // Form handlers
        onFormError,

        // Reactive version counter for forcing re-renders
        formVersion,
    };
}
