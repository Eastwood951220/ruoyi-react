[root](../../../CLAUDE.md) > [features](../../) > [system](../) > **dept**

# Department Management

## Responsibility

Department tree page with CRUD operations, expand/collapse toggle, and nested department support.

## Entry Point

`src/features/system/dept/index.tsx`

## Structure

```
index.tsx              -- Department tree page
index.module.less      -- Page styles
components/
  DeptDrawer.tsx       -- Add/edit department drawer
```

## Key Dependencies

- `useTableList` hook for list management (with tree transform)
- `BaseListPage` component for table layout
- `AuthButton` for permission-gated actions
- `useDict` for dictionary data (sys_normal_disable)
- API: `src/api/system/dept/`

## Permissions

- `system:dept:add` -- Add department
- `system:dept:edit` -- Edit department
- `system:dept:remove` -- Delete department

## Special Behavior

- Uses `buildDeptTree()` to transform flat list to tree structure
- Uses `collectDeptIds()` for expand/collapse all functionality
- `pagination={false}` (tree display, no pagination)

## Changelog

- 2026-06-04: Initial module documentation generated
