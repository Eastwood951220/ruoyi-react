[root](../../../CLAUDE.md) > [features](../../) > [system](../) > **user**

# User Management

## Responsibility

User list page with department tree filtering, CRUD operations, import/export, status toggle, and password reset.

## Entry Point

`src/features/system/user/index.tsx`

## Structure

```
index.tsx              -- Page view layer (thin component)
index.module.less      -- Page styles
hooks/useUserPage.ts   -- Page state and business logic hook
components/
  DeptTreePanel.tsx    -- Left sidebar department tree
  UserDrawer.tsx       -- Add/edit user drawer
  UserImportModal.tsx  -- Import users modal
```

## Key Dependencies

- `useTableList` hook for list management
- `BaseListPage` component for table layout
- `AuthButton` for permission-gated actions
- `useDict` for dictionary data (sys_normal_disable, sys_user_sex)
- API: `src/api/system/user/`, `src/api/system/dept/`

## Permissions

- `system:user:add` -- Add user
- `system:user:edit` -- Edit user
- `system:user:remove` -- Delete user
- `system:user:resetPwd` -- Reset password
- `system:user:import` -- Import users
- `system:user:export` -- Export users

## Page Hook (useUserPage)

Complex page with 15+ state variables, extracted to dedicated hook:
- Form state, selected rows, drawer state
- Department tree data and selection
- Import modal state
- All CRUD actions and status toggle

## Changelog

- 2026-06-04: Initial module documentation generated
