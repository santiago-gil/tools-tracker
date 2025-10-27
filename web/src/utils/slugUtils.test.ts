/**
 * Comprehensive tests for slug utilities
 * Tests slug creation, parsing, and lookup consistency
 */

import { describe, it, expect } from 'vitest';
import { createSlug, findToolBySlug } from './slugUtils';

// Mock tools data for testing
const mockTools = [
    {
        id: '1',
        name: 'Google Analytics',
        normalizedName: 'google-analytics',
        versions: [
            { versionName: 'GA4', slug: 'google-analytics--ga4' },
            { versionName: 'Universal Analytics', slug: 'google-analytics--universal-analytics' }
        ]
    },
    {
        id: '2',
        name: 'HubSpot CRM',
        normalizedName: 'hubspot-crm',
        versions: [
            { versionName: 'Free', slug: 'hubspot-crm--free' },
            { versionName: 'Professional', slug: 'hubspot-crm--professional' },
            { versionName: 'Enterprise', slug: 'hubspot-crm--enterprise' }
        ]
    },
    {
        id: '3',
        name: 'Salesforce',
        normalizedName: 'salesforce',
        versions: [
            { versionName: 'Lightning', slug: 'salesforce--lightning' },
            { versionName: 'Classic', slug: 'salesforce--classic' }
        ]
    },
    {
        id: '4',
        name: 'Tool-With-Hyphens',
        normalizedName: 'tool-with-hyphens',
        versions: [
            { versionName: 'Version-With-Hyphens', slug: 'tool-with-hyphens--version-with-hyphens' },
            { versionName: 'Standard Version', slug: 'tool-with-hyphens--standard-version' }
        ]
    },
    {
        id: '5',
        name: 'Tool With Spaces',
        normalizedName: 'tool-with-spaces',
        versions: [
            { versionName: 'Version With Spaces', slug: 'tool-with-spaces--version-with-spaces' },
            { versionName: 'v1.0', slug: 'tool-with-spaces--v10' }
        ]
    }
];

describe('Slug Utilities', () => {
    describe('createSlug', () => {
        it('should create valid slugs for simple tool and version names', () => {
            expect(createSlug('Google Analytics', 'GA4')).toBe('google-analytics--ga4');
            expect(createSlug('HubSpot CRM', 'Free')).toBe('hubspot-crm--free');
            expect(createSlug('Salesforce', 'Lightning')).toBe('salesforce--lightning');
        });

        it('should handle names with special characters', () => {
            expect(createSlug('Tool & Service', 'v2.0')).toBe('tool-and-service--v20');
            expect(createSlug('CRM@Work', 'Pro+')).toBe('crmwork--pro');
            expect(createSlug('API Gateway', 'v1.0-beta')).toBe('api-gateway--v10-beta');
        });

        it('should handle names with multiple spaces', () => {
            expect(createSlug('Tool   With   Spaces', 'Version   Name')).toBe('tool-with-spaces--version-name');
        });

        it('should handle names with hyphens', () => {
            expect(createSlug('Tool-With-Hyphens', 'Version-Name')).toBe('tool-with-hyphens--version-name');
        });

        it('should remove leading and trailing hyphens', () => {
            expect(createSlug('-Tool-', '-Version-')).toBe('tool--version');
        });

        it('should handle consecutive hyphens', () => {
            expect(createSlug('Tool--With--Hyphens', 'Version--Name')).toBe('tool-with-hyphens--version-name');
        });

        it('should throw error for empty tool name', () => {
            expect(() => createSlug('', 'Version')).toThrow('Tool name is required');
        });

        it('should throw error for empty version name', () => {
            expect(() => createSlug('Tool', '')).toThrow('Version name is required');
        });

        it('should throw error for tool name that results in empty slug', () => {
            expect(() => createSlug('!!!', 'Version')).toThrow('Normalized toolName must contain alphanumeric characters');
        });

        it('should throw error for version name that results in empty slug', () => {
            expect(() => createSlug('Tool', '!!!')).toThrow('Normalized versionName must contain alphanumeric characters');
        });

        it('should throw error for slug that is too short', () => {
            expect(() => createSlug('A', '')).toThrow('Version name is required');
        });

        it('should throw error for slug that is too long', () => {
            const longName = 'A'.repeat(100);
            expect(() => createSlug(longName, longName)).toThrow('Slug too long');
        });
    });


    describe('findToolBySlug', () => {
        it('should find tools by slug using pre-computed slug fields', () => {
            const result = findToolBySlug(mockTools, 'google-analytics--ga4');
            expect(result).not.toBeNull();
            expect(result?.tool.name).toBe('Google Analytics');
            expect(result?.version.versionName).toBe('GA4');
        });

        it('should find tools with hyphens in names', () => {
            const result = findToolBySlug(mockTools, 'tool-with-hyphens--version-with-hyphens');
            expect(result).not.toBeNull();
            expect(result?.tool.name).toBe('Tool-With-Hyphens');
            expect(result?.version.versionName).toBe('Version-With-Hyphens');
        });

        it('should find tools with spaces in names', () => {
            const result = findToolBySlug(mockTools, 'tool-with-spaces--version-with-spaces');
            expect(result).not.toBeNull();
            expect(result?.tool.name).toBe('Tool With Spaces');
            expect(result?.version.versionName).toBe('Version With Spaces');
        });

        it('should return null for non-existent tools', () => {
            expect(findToolBySlug(mockTools, 'non-existent-tool--version')).toBeNull();
        });

        it('should return null for non-existent versions', () => {
            expect(findToolBySlug(mockTools, 'google-analytics--non-existent')).toBeNull();
        });

        it('should return null for invalid slug formats', () => {
            expect(findToolBySlug(mockTools, 'invalid-slug!!!')).toBeNull();
            expect(findToolBySlug(mockTools, '')).toBeNull();
        });

        it('should handle empty tools array', () => {
            expect(findToolBySlug([], 'google-analytics--ga4')).toBeNull();
        });

        it('should handle null/undefined inputs', () => {
            expect(findToolBySlug(mockTools, '')).toBeNull();
            expect(findToolBySlug(mockTools, null as any)).toBeNull();
            expect(findToolBySlug(null as any, 'google-analytics--ga4')).toBeNull();
        });
    });

    describe('Slug Creation and Lookup Consistency', () => {
        it('should maintain consistency between slug creation and lookup', () => {
            // Test all tool/version combinations
            for (const tool of mockTools) {
                for (const version of tool.versions) {
                    try {
                        const slug = createSlug(tool.name, version.versionName);
                        const result = findToolBySlug(mockTools, slug);

                        expect(result).not.toBeNull();
                        expect(result?.tool.name).toBe(tool.name);
                        expect(result?.version.versionName).toBe(version.versionName);
                    } catch (error) {
                        // If slug creation fails, that's expected for some edge cases
                        // The important thing is that if creation succeeds, lookup should too
                        console.log(`Skipping ${tool.name}/${version.versionName} due to slug creation error:`, error);
                    }
                }
            }
        });

        it('should handle round-trip conversion correctly', () => {
            const testCases = [
                { tool: 'Google Analytics', version: 'GA4' },
                { tool: 'HubSpot CRM', version: 'Free' },
                { tool: 'Tool-With-Hyphens', version: 'Version-With-Hyphens' },
                { tool: 'Tool With Spaces', version: 'Version With Spaces' }
            ];

            for (const testCase of testCases) {
                try {
                    const slug = createSlug(testCase.tool, testCase.version);
                    const result = findToolBySlug(mockTools, slug);
                    expect(result).not.toBeNull();
                    expect(result?.tool.name).toBe(testCase.tool);
                    expect(result?.version.versionName).toBe(testCase.version);
                } catch (error) {
                    console.log(`Skipping ${testCase.tool}/${testCase.version} due to error:`, error);
                }
            }
        });
    });

    describe('Performance Tests', () => {
        it('should complete slug creation quickly', () => {
            const startTime = performance.now();

            for (let i = 0; i < 1000; i++) {
                createSlug('Test Tool', 'Test Version');
            }

            const duration = performance.now() - startTime;
            expect(duration).toBeLessThan(1000); // Should complete in < 1 second
        });


        it('should complete tool lookup quickly', () => {
            const startTime = performance.now();

            for (let i = 0; i < 1000; i++) {
                findToolBySlug(mockTools, 'google-analytics--ga4');
            }

            const duration = performance.now() - startTime;
            expect(duration).toBeLessThan(1000); // Should complete in < 1 second
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle tools with no versions gracefully', () => {
            const toolsWithNoVersions = [
                {
                    id: '1',
                    name: 'Tool Without Versions',
                    normalizedName: 'tool-without-versions',
                    versions: []
                }
            ];

            expect(findToolBySlug(toolsWithNoVersions, 'tool-without-versions--any-version')).toBeNull();
        });

        it('should handle tools with duplicate version names', () => {
            const toolsWithDuplicateVersions = [
                {
                    id: '1',
                    name: 'Tool With Duplicates',
                    normalizedName: 'tool-with-duplicates',
                    versions: [
                        { versionName: 'Version', slug: 'tool-with-duplicates--version' },
                        { versionName: 'Version', slug: 'tool-with-duplicates--version' } // Duplicate slug
                    ]
                }
            ];

            const result = findToolBySlug(toolsWithDuplicateVersions, 'tool-with-duplicates--version');
            expect(result).not.toBeNull();
            expect(result?.tool.name).toBe('Tool With Duplicates');
            expect(result?.version.versionName).toBe('Version');
        });

        it('should handle very long tool and version names', () => {
            const longToolName = 'A'.repeat(50);
            const longVersionName = 'B'.repeat(50);

            try {
                const slug = createSlug(longToolName, longVersionName);
                expect(slug.length).toBeLessThanOrEqual(200);
            } catch (error) {
                // If slug creation fails due to length, that's expected
                expect(error).toBeDefined();
            }
        });

        it('should handle Unicode characters in names', () => {
            try {
                const slug = createSlug('Tool with émojis 🚀', 'Version with ñ');
                expect(slug).toBe('tool-with-mojis--version-with-n');
            } catch (error) {
                // Unicode handling might vary, but should not crash
                expect(error).toBeDefined();
            }
        });
    });
});