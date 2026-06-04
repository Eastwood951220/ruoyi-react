[root](../../../CLAUDE.md) > [features](../../) > [system](../) > **role**

# Role Management

## Responsibility

Role list page with CRUD, data scope assignment, and user assignment management.

## Entry Point

`src/features/system/role/index.tsx`

## Structure

```
index.tsx                    -- Role list page
index.module.less            -- Page styles
authUser.tsx                 -- Auth user sub-page (route: /system/role-auth/user/$roleId)
components/
  RoleDrawer.tsx             -- Add/edit role drawer
  DataScopeDrawer.tsx        -- Data scope assignment drawer
  SelectUserModal.tsx        -- Select user for role assignment modal
```

## Key Dependencies

- `useTableList` hook for list management
- `BaseListPage` component for table layout
- `AuthButton` for permission-gated actions
- `useDict` for dictionary data (sys_normal_disable)
- API: `src/api/system/role/`

## Permissions

- `system:role:add` -- Add role
- `system:role:edit` -- Edit role
- `system:role:remove` -- Delete role
- `system:role:export` -- Export roles

## Sub-Pages

- `authUser.tsx` -- Manages users assigned to a role (allocated/unallocated lists, cancel/select all)

## Changelog

- 2026-06-04: Initial module documentation generated
