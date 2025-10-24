import { useMemo } from 'react';
import type { Tool } from '../types';

interface UseToolFilteringProps {
    tools: Tool[] | undefined;
    searchQuery: string;
    selectedCategory: string;
    showSKRecommendedOnly: boolean;
}

export function useToolFiltering({
    tools,
    searchQuery,
    selectedCategory,
    showSKRecommendedOnly,
}: UseToolFilteringProps) {
    const categories = useMemo(() => {
        if (!tools) return [];
        return Array.from(new Set(tools.map((t) => t.category))).sort();
    }, [tools]);

    const filteredTools = useMemo(() => {
        if (!tools) return [];

        // Pre-compute search query for better performance
        const searchQueryLower = searchQuery?.toLowerCase();

        return tools
            .filter((tool) => {
                // Apply SK recommended filter first (most selective)
                if (showSKRecommendedOnly && !tool.versions.some((v) => v.sk_recommended)) {
                    return false;
                }

                // Apply category filter
                if (selectedCategory && tool.category !== selectedCategory) {
                    return false;
                }

                // Apply search filter (most expensive, do last)
                if (searchQueryLower) {
                    const nameMatch = tool.name.toLowerCase().includes(searchQueryLower);
                    const categoryMatch = tool.category.toLowerCase().includes(searchQueryLower);

                    if (nameMatch || categoryMatch) return true;

                    // Only search in versions if name/category don't match
                    return tool.versions.some((v) => {
                        const considerationsMatch = v.team_considerations
                            ?.toLowerCase()
                            .includes(searchQueryLower);
                        if (considerationsMatch) return true;

                        // Only search trackables if considerations don't match
                        return Object.values(v.trackables).some((trackable) =>
                            trackable?.notes?.toLowerCase().includes(searchQueryLower),
                        );
                    });
                }

                return true;
            })
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [tools, selectedCategory, searchQuery, showSKRecommendedOnly]);

    return {
        categories,
        filteredTools,
    };
}
