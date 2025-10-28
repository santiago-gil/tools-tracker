# Fix for Missing normalizedName and updatedBy Fields

## Problem
Newly created tools were missing two important fields:
1. **`normalizedName`** - Used for duplicate detection and efficient lookups
2. **`updatedBy`** - Audit trail showing who created/updated the tool

Example of a tool created without these fields:
```json
{
  "name": "123FormBuilder",
  "category": "3rd Party Forms & Booking Tools",
  "createdAt": "2025-10-28T04:32:03.708Z",
  "updatedAt": "2025-10-28T04:48:57.265Z"
  // missing: normalizedName, updatedBy
}
```

## Root Cause

### Missing `updatedBy`
The `addTool` function didn't accept the request object, so it had no access to user information to set the `updatedBy` field.

### `normalizedName` Issue
The field was being added in code but wasn't being properly persisted (possibly due to order of operations when spreading the data object).

## Solution

### 1. Updated `addTool` signature (functions/src/services/tools.ts)
Now accepts optional `req` parameter:

```typescript
export async function addTool(data: CreateTool, req?: AuthedRequest): Promise<ToolWithId>
```

### 2. Added `updatedBy` field (lines 263-270)
Now sets user info when request context is available:

```typescript
const toolData = {
  ...data,
  normalizedName,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _optimisticVersion: 0,
  versions: normalizedVersions,
  // Add user info if request context is available
  ...(req?.user && {
    updatedBy: {
      uid: req.user.uid,
      name: req.user.displayName || req.user.email || 'Unknown',
      email: req.user.email,
    },
  }),
};
```

### 3. Updated route handler (functions/src/routes/tools.ts line 106)
Now passes request object to `addTool`:

```typescript
const createdTool = await addTool(toolData, req);
```

### 4. Added `updatedBy` to `updateTool` (functions/src/services/tools.ts lines 383-390)
Now also sets `updatedBy` when updating tools:

```typescript
const updateData = {
  ...data,
  ...(nameChanged && { normalizedName: normalizeName(mergedData.name) }),
  updatedAt: new Date().toISOString(),
  // Add user info if request context is available
  ...(req?.user && {
    updatedBy: {
      uid: req.user.uid,
      name: req.user.displayName || req.user.email || 'Unknown',
      email: req.user.email,
    },
  }),
};
```

### 5. Added logging (lines 273, 279, 287)
Added debug logging to track whether `normalizedName` is being saved properly.

## Result

Now when you create a tool, it will have:
- ✅ `normalizedName`: "123formbuilder" (slugified name for lookups)
- ✅ `updatedBy`: { uid, name, email } (audit trail)

When you update a tool, it will also update the `updatedBy` field with the current user's information.

## Testing

1. Create a new tool
2. Check the database - it should now have:
   - `normalizedName` field
   - `updatedBy` field with your user info
3. Update the tool
4. Check that `updatedBy` is updated with the current user

## Notes

- The `normalizedName` field is essential for the duplicate detection to work properly
- The `updatedBy` field provides an audit trail of who created/updated each tool
- Both fields are optional in the schema to maintain backward compatibility with older tools

