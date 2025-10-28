# Duplicate Detection Optimization

## Summary
Optimized duplicate detection from O(n) category-wide scans to O(1) index lookups using Firestore's `normalizedName` field.

## Changes Made

### 1. Optimized `addTool` (lines 209-223)
**Before**: Scanned all tools in category, checked each tool twice  
**After**: Direct query using normalizedName index

```typescript
// O(1) lookup using normalizedName index
const queryByNormalizedName = toolsCol
  .where('category', '==', data.category)
  .where('normalizedName', '==', normalizedName)
  .limit(1);

const existingNormalizedNameTool = await queryByNormalizedName.get();

if (!existingNormalizedNameTool.empty) {
  const existingTool = existingNormalizedNameTool.docs[0].data();
  throw new Error(`Tool with name "${existingTool.name}" already exists...`);
}
```

### 2. Optimized `updateTool` (lines 284-329)
**Before**: Scanned all tools in category for duplicates  
**After**: Direct query with exclusion check

```typescript
// O(1) lookup using normalizedName index
const queryByNormalizedName = toolsCol
  .where('category', '==', category)
  .where('normalizedName', '==', newNormalizedName)
  .limit(1);

const existingNormalizedNameTool = await queryByNormalizedName.get();

if (!existingNormalizedNameTool.empty) {
  const conflictingTool = existingNormalizedNameTool.docs[0];
  if (conflictingTool.id !== id) { // Exclude tool being updated
    // Return error
  }
}
```

### 3. Removed Legacy Fallback
Removed the backward compatibility code that scanned all tools for legacy entries without `normalizedName`. Since you're deleting and recreating the tool, all tools will have `normalizedName`.

## Performance Benefits

| Operation | Before | After |
|-----------|--------|-------|
| **addTool** | O(n) scan all tools | O(1) index lookup |
| **updateTool** | O(n) scan all tools | O(1) index lookup |
| **Network calls** | 1 query, n documents | 1 query, 1 document |
| **Memory** | Loads all tools | Loads 1 tool |

## Firestore Index Required

The following Firestore index is required for this to work:

```json
{
  "indexes": [
    {
      "collectionGroup": "tools",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "normalizedName", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## Testing

1. Try to create a duplicate tool (same name, same category)
2. Should get error: "Tool with name X already exists..."
3. Create a tool with same name in different category
4. Should succeed (normalized names can be same across categories)

## Notes

- All tools now have `normalizedName` field
- Legacy fallback code removed for cleaner codebase
- Query uses `.limit(1)` to minimize data transfer
- Error messages remain user-friendly

