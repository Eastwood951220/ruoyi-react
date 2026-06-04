[root](../../../CLAUDE.md) > [features](../../) > [system](../) > **dict**

# Dictionary Management

## Responsibility

Two pages: dictionary type list and dictionary data list. Types define categories, data defines key-value pairs within categories.

## Entry Points

- Type list: `src/features/system/dict/index.tsx`
- Data list: `src/features/system/dict/data.tsx`

## Structure

```
index.tsx                    -- Dictionary type list page
data.tsx                     -- Dictionary data list page
index.module.less            -- Type list styles
data.module.less             -- Data list styles
components/
  DictTypeDrawer.tsx         -- Add/edit dict type drawer
  DictDataDrawer.tsx         -- Add/edit dict data drawer
```

## Key Dependencies

- `useTableList` hook for list management
- `BaseListPage` component for table layout
- `AuthButton` for permission-gated actions
- `useDictStore` for cache management
- API: `src/api/system/dict/type/`, `src/api/system/dict/data/`

## Permissions

- `system:dict:add` -- Add dict type/data
- `system:dict:edit` -- Edit dict type/data
- `system:dict:remove` -- Delete dict type/data
- `system:dict:export` -- Export dict type/data

## Navigation

- Type list -> click dict type -> navigate to `/system/dict-data?dictType=xxx&dictName=xxx`
- Data list has back button to return to type list

## Special Features

- Refresh cache button clears both backend cache and frontend useDictStore

## Changelog

- 2026-06-04: Initial module documentation generated
