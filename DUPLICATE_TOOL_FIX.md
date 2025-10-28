# Fix for Duplicate Tool Creation Bug

## Problem
Users were able to create duplicate tools even though the backend validation should prevent this. The frontend was detecting duplicate URL keys (collisions) but the backend wasn't catching them.

## Root Cause
The backend validation was only checking for duplicate tools using the `normalizedName` field:

```javascript
const existingTools = await toolsCol
  .where('category', '==', data.category)
  .where('normalizedName', '==', normalizedName)
  .get();
```

However, `normalizedName` is an **optional field** in the schema, meaning legacy tools created before this field was added don't have it. This allowed duplicates to be created because:

1. An old tool "Tool A" exists without `normalizedName`
2. User tries to create "Tool A" again (which becomes "tool-a" when normalized)
3. The query for `normalizedName == "tool-a"` returns empty because the old tool has no `normalizedName`
4. The duplicate gets created
5. Frontend detects the collision when both tools appear in the list

## Solution

### 1. Updated `addTool` function (functions/src/services/tools.ts)
Now checks ALL tools in the category, computing the normalized name on-the-fly for legacy tools:

```javascript
// Get all tools in this category
const allToolsInCategory = await toolsCol
  .where('category', '==', data.category)
  .get();

// Check if any tool has the same normalized name (handles both new and legacy tools)
const hasDuplicate = allToolsInCategory.docs.some(doc => {
  const tool = doc.data();
  // Check if tool has normalizedName (newer tools)
  if (tool.normalizedName === normalizedName) {
    return true;
  }
  // For legacy tools without normalizedName, calculate it on the fly
  if (!tool.normalizedName && tool.name) {
    const legacyNormalizedName = normalizeName(tool.name);
    return legacyNormalizedName === normalizedName;
  }
  return false;
});
```

### 2. Updated `updateTool` function (functions/src/services/tools.ts)
Applied the same fix to the update validation when a tool's name is changed.

### 3. Created backfill script (functions/src/utils/backfill-normalized-name.ts)
A migration script to add `normalizedName` to all existing legacy tools, preventing the need for on-the-fly computation in the future.

## How to Run the Backfill

To add `normalizedName` to all existing tools, you can import and run the backfill function:

```typescript
import { backfillNormalizedName } from './utils/backfill-normalized-name.js';

await backfillNormalizedName();
```

Or use it as a standalone script.

## Testing

1. Try to create a tool with the same name as an existing tool in the same category
2. The backend should now properly reject the duplicate with an error message
3. The duplicate should NOT appear in the list

## Notes

- This fix is backward-compatible with both old (no `normalizedName`) and new (with `normalizedName`) tools
- The query now fetches ALL tools in the category, which is slightly less efficient but necessary for data integrity
- Once all tools have `normalizedName` (via the backfill), we could optimize this back to a direct query

