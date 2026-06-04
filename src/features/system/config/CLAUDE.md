[root](../../../CLAUDE.md) > [features](../../) > [system](../) > **config**

# Config Management

## Responsibility

System configuration parameter list page with CRUD and cache refresh.

## Entry Point

`src/features/system/config/index.tsx`

## Structure

```
index.tsx              -- Config list page
index.module.less      -- Page styles
components/
  ConfigDrawer.tsx     -- Add/edit config drawer
```

## Key Dependencies

- `useTableList` hook for list management
- `BaseListPage` component for table layout
- `AuthButton` for permission-gated actions
- `useDict` for dictionary data (sys_yes_no)
- `DictTag` for status display
- API: `src/api/system/config/`

## Permissions

- `system:config:add` -- Add config
- `system:config:edit` -- Edit config
- `system:config:remove` -- Delete config
- `system:config:export` -- Export configs

## Changelog

- 2026-06-04: Initial module documentation generated
