[root](../../../../CLAUDE.md) > [api](../../../) > [system](../../) > [dict](../) > **data**

# Dictionary Data API

## Responsibility

Dictionary data CRUD within a dictionary type.

## Entry Point

`src/api/system/dict/data/index.ts`

## Exports

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getDicts` | GET | `/system/dict/data/type/{dictType}` | Get dict data by type (for dropdowns) |
| `listData` | GET | `/system/dict/data/list` | Query dict data list (paginated) |
| `getData` | GET | `/system/dict/data/{dictCode}` | Get dict data detail |
| `addData` | POST | `/system/dict/data` | Create dict data |
| `updateData` | PUT | `/system/dict/data` | Update dict data |
| `delData` | DELETE | `/system/dict/data/{ids}` | Delete dict data |
| `exportData` | POST | `/system/dict/data/export` | Export dict data |

## Changelog

- 2026-06-04: Initial module documentation generated
