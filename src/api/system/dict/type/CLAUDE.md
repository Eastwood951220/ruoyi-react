[root](../../../../CLAUDE.md) > [api](../../../) > [system](../../) > [dict](../) > **type**

# Dictionary Type API

## Responsibility

Dictionary type CRUD and cache management.

## Entry Point

`src/api/system/dict/type/index.ts`

## Exports

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `listType` | GET | `/system/dict/type/list` | Query dict type list |
| `getType` | GET | `/system/dict/type/{dictId}` | Get dict type detail |
| `addType` | POST | `/system/dict/type` | Create dict type |
| `updateType` | PUT | `/system/dict/type` | Update dict type |
| `delType` | DELETE | `/system/dict/type/{ids}` | Delete dict types |
| `refreshCache` | DELETE | `/system/dict/type/refreshCache` | Refresh dict cache |
| `exportType` | POST | `/system/dict/type/export` | Export dict types |

## Changelog

- 2026-06-04: Initial module documentation generated
