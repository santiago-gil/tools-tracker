# Edit Route Fixes

## Problems Found & Fixed

### 1. ❌ Import Path Error
**Error**: `Cannot find module '../../components/tools/ToolList'`

**Cause**: Wrong relative path (routes folder is at same level as components)

**Fix**: Changed to `../components/tools/ToolList`

```typescript
// Before
import { ToolList } from '../../components/tools/ToolList';

// After  
import { ToolList } from '../components/tools/ToolList';
```

### 2. ❌ Missing RBAC Protection
**Problem**: Edit route had no permission checks

**Fix**: Added `beforeLoad` hook with permission check

```typescript
export const Route = createFileRoute('/_authenticated/tools/$category/$tool/edit')({
  component: ToolList,
  beforeLoad: ({ context }) => {
    if (context.auth.loading) return;
    
    if (!context.auth.user) {
      throw redirect({ to: '/sign-in' });
    }

    // Only users with edit permission can access
    if (!context.auth.user.permissions?.edit) {
      throw redirect({ to: '/tools' });
    }
  },
  validateSearch: z.object({
    v: z.string().optional(),
  }),
});
```

### 3. ✅ Permission Structure Verified

From `shared/schemas/users.ts`:
```typescript
export const UserPermissionsSchema = z.object({
    add: z.boolean().default(false),
    edit: z.boolean().default(false),    // ✅ Used for edit route
    delete: z.boolean().default(false),
    manageUsers: z.boolean().default(false),
});
```

Role permissions:
- **admin**: `{ edit: true }` ✅
- **ops**: `{ edit: true }` ✅
- **viewer**: `{ edit: false }` ❌

### 4. ✅ Edit Button Already Protected

In `ToolRowHeader.tsx` (line 210-228):
```typescript
{(user?.permissions?.edit || user?.permissions?.delete) && (
  <div className="flex items-center gap-2">
    {user?.permissions?.edit && (
      <button onClick={onEdit}>Edit</button>
    )}
  </div>
)}
```

**RBAC layers:**
1. **UI Level**: Edit button only shows if user has `edit` permission
2. **Route Level**: Edit route blocks access if no `edit` permission (NEW)
3. **API Level**: Backend should also check permissions (verify separately)

## Testing the Fix

### Build Test
```bash
cd web && npm run build
# ✅ Builds successfully
```

### Permission Flow Test
1. **Admin/Ops user**: Can click Edit → navigates to `/edit` → can edit
2. **Viewer user**: Can't click Edit (button hidden) 
3. **Direct URL access** (viewer): Gets redirected to `/tools`
4. **Unauthenticated**: Gets redirected to `/sign-in`

## Summary

✅ **Import path fixed** - Component loads correctly  
✅ **RBAC added** - Route is protected with permission checks  
✅ **Consistent with UI** - Same permission (`edit`) used everywhere  
✅ **Proper redirects** - Unauthorized users get sent back to tools list  

The edit route is now secure and matches the permissions model.
