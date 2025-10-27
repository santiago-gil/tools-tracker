# Utils Module

This module contains utility functions for the application.

## URL-Based Routing

The application uses TanStack Router with file-based routing and URL slugs derived from tool data:

- **URL structure**: `/tools/:category/:tool?v=version-name`
- **URL slugs**: Normalized versions of category and tool names (e.g., "chat-tools", "google-analytics")
- **Database**: Stores actual category/tool names (e.g., "Chat Tools", "Google Analytics")
- **Lookup**: Direct array search matching normalized names from URL params to actual tool data

### Navigation Example

```typescript
import { normalizeName } from '@shared/schemas/stringUtils';
import { useParams, useSearch, useNavigate } from '@tanstack/react-router';

// Navigate to a tool
const navigate = useNavigate();
const categorySlug = normalizeName(tool.category); // "Chat Tools" → "chat-tools"
const toolSlug = normalizeName(tool.name); // "Google Analytics" → "google-analytics"
navigate({ 
  to: '/tools/$category/$tool', 
  params: { category: categorySlug, tool: toolSlug },
  search: { v: versionName } // optional version query param
});

// Find tool from URL params
const params = useParams();
const search = useSearch();
const { category, tool } = params; // URL slugs
const versionName = search.v;

// Match tool by normalizing and comparing
const tool = tools.find(t => 
  normalizeName(t.category) === category &&
  normalizeName(t.name) === tool
);
```

## Files in this Module

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