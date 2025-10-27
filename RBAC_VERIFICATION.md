# RBAC Verification for Edit Route

## ✅ Current Setup is CORRECT

The edit route RBAC implementation follows the exact same pattern as other protected routes in the codebase.

## Frontend RBAC Layers

### 1. Route-Level Protection ✅ (Same as users route)
**Location**: `_authenticated.tools.$category.$tool.edit.tsx`

```typescript
beforeLoad: ({ context }) => {
  if (context.auth.loading) return;
  
  if (!context.auth.user) {
    throw redirect({ to: '/sign-in' });
  }

  // Only users with edit permission can access
  if (!context.auth.user.permissions?.edit) {
    throw redirect({ to: '/tools' });
  }
}
```

**Matches**: `_authenticated.users.tsx` uses the exact same pattern for `manageUsers`

### 2. UI-Level Protection ✅ (Already implemented)
**Location**: `ToolRowHeader.tsx` (line 210-228)

```typescript
{(user?.permissions?.edit || user?.permissions?.delete) && (
  <div className="flex items-center gap-2">
    {user?.permissions?.edit && (
      <button onClick={onEdit}>Edit</button>
    )}
  </div>
)}
```

- Button only shows if user has permission
- Button hidden from viewers

### 3. Action-Level Protection ✅ (Event handler)
**Location**: `ToolList.tsx`

The edit handler navigates to the protected route. If the user gets there without permission (race condition), the route `beforeLoad` will redirect them.

## Backend RBAC (Verification)

### Routes Protection ✅
**Location**: `functions/src/routes/tools.ts` (lines 123-125)

```typescript
router.put(
  "/:id",
  requirePerm("edit"),  // ✅ Backend enforces edit permission
  validateParams(idParamSchema),
  validateBody(UpdateToolSchema),
  // ...
)
```

### Middleware Implementation ✅
**Location**: `functions/src/middleware/perms.ts`

```typescript
export function requirePerm(
  action: "add" | "edit" | "delete" | "manageUsers"
) {
  return asyncHandler(async (req: AuthedRequest, _res, next) => {
    const user = req.user;
    
    if (!user) {
      return next({ status: 401, message: "Unauthorized" });
    }
    
    const hasPermission = user.permissions?.[action];
    
    if (!hasPermission) {
      logger.warn(
        { uid: user.uid, role: user.role, action, permissions: user.permissions },
        "Permission denied"
      );
      return next({
        status: 403,
        message: "Forbidden"
      });
    }
    
    next();
  });
}
```

## Complete RBAC Flow

### When User Clicks Edit:

1. **Frontend UI** (`ToolRowHeader.tsx`)
   - Button only visible if `user.permissions?.edit === true`
   - Viewer sees no edit button ✅

2. **Frontend Route** (`_authenticated.tools.$category.$tool.edit.tsx`)
   - `beforeLoad` checks `context.auth.user.permissions?.edit`
   - If no permission → redirect to `/tools`
   - If viewer tries direct URL → blocked ✅

3. **Frontend API Call** (`toolsApi.update()`)
   - User attempts to save
   - React Query mutation fires PUT request ✅

4. **Backend Middleware** (`requirePerm("edit")`)
   - Checks `req.user.permissions?.edit`
   - If false → 403 Forbidden response
   - Backend logs the attempt ✅

5. **Backend Service** (`updateTool()`)
   - Only reached if permission check passes
   - Updates tool in database ✅

## Comparison with Other Routes

| Route | Permission Check | Location | Pattern |
|-------|-----------------|----------|---------|
| `/tools/:cat/:tool/edit` | `edit` | `beforeLoad` | ✅ Same |
| `/users` | `manageUsers` | `beforeLoad` | ✅ Same |
| `PUT /tools/:id` | `edit` | `requirePerm` | ✅ Backend |
| `DELETE /tools/:id` | `delete` | `requirePerm` | ✅ Backend |
| `POST /tools` | `add` | `requirePerm` | ✅ Backend |

## Defensive Layers

```
User Action
    ↓
1. UI hides button (no permission = can't click)
    ↓
2. Route blocks access (beforeLoad redirects)
    ↓
3. API call gets rejected (requirePerm middleware)
    ↓
4. Database update never happens
```

**Even if someone bypasses layer 1, layers 2-4 catch them.**

## Issues Check

### ❓ Potential Issue: Race Condition?
**Scenario**: User has permission → clicks edit → permission revoked in another tab → saves

**Analysis**: 
- Route would still allow (permission checked once on navigation)
- Backend would reject the actual save request ✅
- Result: User can navigate to edit but can't save ❌

**Current behavior**: Acceptable for UX - user gets visual error when trying to save

### ❓ Better Approach?
Could we add a check in the component too?

Actually, the route-level check is sufficient because:
- Navigation to `/edit` requires permission
- Once there, the Save button is in the modal (always visible to authenticated user)
- Backend will reject the actual save if permission is gone
- User gets toast error: "Failed to update tool"

## Verdict

✅ **The RBAC setup is CORRECT and follows existing patterns**

- Matches users route pattern exactly
- Has proper backend enforcement
- Multiple defensive layers
- Handles edge cases appropriately

No changes needed!
