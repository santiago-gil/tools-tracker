# Should We Use an /edit Route?

## Current Approach (Modal)
- ✅ Fast - no navigation
- ✅ Can see tool list behind modal
- ❌ Complex state management (editingTool, justSaved)
- ❌ Modal flashing issues
- ❌ Not URL-friendly (can't share edit link)
- ❌ Browser back button doesn't work naturally

## /edit Route Approach
- ✅ URL-based state (shareable, bookmarkable)
- ✅ Browser back button works naturally
- ✅ Less complex state management
- ✅ Full page = better accessibility
- ❌ Requires navigation away from list
- ❌ Can't see list while editing

## Recommendation: **Stick with Modal, Fix the Issues**

### Why Modal is Better for This App

1. **Context matters** - User editing a tool often needs to reference the list/category
2. **Quick edits** - Many users make small changes and want to stay in context
3. **Version switching** - The sidebar already shows versions in the list context

### The Real Problem
The bug wasn't caused by using a modal - it was caused by an **overly eager effect** that was clearing state too early.

### Solution: Fix the Modal, Don't Add /edit Route

The fix I just implemented (adding `justSaved` flag) should resolve the flashing issue.

## Alternative: Hybrid Approach

If we do want to add /edit later, we could:

```
/tools → List view
/tools/:category/:tool → View/Edit in place (current)
/tools/:category/:tool/edit → Full page edit (optional)
```

But this adds complexity without clear benefit for this use case.

## Verdict: **Don't add /edit route**
- Current modal approach is fine once we fix the eager effect
- Adding a route would require more code changes
- The bug is fixed with the `justSaved` flag
- Simpler to maintain one editing paradigm
