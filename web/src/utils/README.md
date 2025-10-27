# Utils Module

This module contains utility functions for the application, with a focus on slug generation and lookup functionality.

## Slug Utilities (`slugUtils.ts`)

The slug utilities provide a simple, efficient way to create and lookup tools by URL-friendly slugs. This system leverages the backend's pre-computed slug fields for optimal performance.

### How It Works

The backend maintains optimized slug fields in the Tool schema:
- `normalizedName`: Normalized tool name for O(1) tool lookup
- `slugVersions`: Pre-computed slugs for each version

The frontend uses these pre-computed fields for fast lookups without maintaining its own cache.

### Key Functions

#### `createSlug(toolName, versionName, identifier?)`
Creates a URL-friendly slug from tool and version names.

```typescript
const slug = createSlug('Google Analytics', 'GA4');
// Returns: 'google-analytics--ga4'
```

#### `parseSlug(slug)`
Parses a slug back into tool and version names.

```typescript
const parsed = parseSlug('google-analytics--ga4');
// Returns: { toolName: 'google analytics', versionName: 'ga4' }
```

#### `findToolBySlug(tools, slug, identifier?)`
Finds a tool and version by slug using pre-computed backend fields.

```typescript
const result = findToolBySlug(tools, 'google-analytics--ga4');
// Returns: { tool: Tool, version: ToolVersion } | null
```

### Performance Characteristics

- **Slug Creation**: O(1) - Simple string operations
- **Slug Parsing**: O(1) - Simple string operations  
- **Tool Lookup**: O(n) - Linear search through loaded tools (acceptable since tools are already loaded)

### Rate Limiting

The slug utilities include built-in rate limiting to prevent abuse:
- 100 slug operations per minute per user/IP
- Automatic cleanup of expired rate limit entries
- Configurable limits via constants

### Usage in Components

```typescript
import { createSlug, findToolBySlug } from '../utils/slugUtils';

// Create slug for navigation
const slug = createSlug(tool.name, tool.versions[0].versionName);
router.navigate({ to: '/tools/$toolSlug', params: { toolSlug: slug } });

// Find tool from URL slug
const result = findToolBySlug(tools, toolSlug);
if (result) {
    const { tool, version } = result;
    // Use tool and version
}
```

### Backend Integration

The slug system integrates seamlessly with the backend's optimized slug fields:

1. **Backend maintains** `normalizedName` and `slugVersions` fields
2. **Frontend uses** these pre-computed fields for lookups
3. **No client-side cache** needed - backend handles optimization
4. **Automatic updates** when tools are modified

### Error Handling

The utilities provide comprehensive error handling:
- Validation errors for invalid input
- Rate limit exceeded errors
- Graceful handling of missing tools/versions
- Clear error messages for debugging

### Testing

The module includes comprehensive tests covering:
- Slug creation and parsing
- Tool lookup functionality
- Rate limiting behavior
- Edge cases and error conditions
- Performance characteristics

Run tests with:
```bash
npm test slugUtils.test.ts
```

## Files in this Module

- `slugUtils.ts` - Core slug generation and lookup utilities
- `slugUtils.test.ts` - Comprehensive test suite
- `trackableFields.ts` - Field validation utilities
- `urlValidation.ts` - URL validation utilities
- `buttonVariants.ts` - Button styling variants
- `htmlId.ts` - HTML ID generation utilities
- `uniqueId.ts` - Unique ID generation utilities

## Contributing

When adding new utilities:

1. **Follow existing patterns** for error handling and validation
2. **Include comprehensive tests** for all functionality
3. **Document performance characteristics** and limitations
4. **Update this README** with any new requirements or patterns