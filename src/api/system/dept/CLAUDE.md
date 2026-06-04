[root](../../../CLAUDE.md) > [api](../../) > [system](../) > **dept**

# Department API

## Responsibility

Department management CRUD and tree operations.

## Entry Point

`src/api/system/dept/index.ts`

## Exports

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `deptTreeSelect` | GET | `/system/user/deptTree` | Get department dropdown tree |
| `listDept` | GET | `/system/dept/list` | Query department list (tree) |
| `getDept` | GET | `/system/dept/{deptId}` | Get department detail |
| `listDeptExcludeChild` | GET | `/system/dept/list/exclude/{deptId}` | List excluding node and children |
| `addDept` | POST | `/system/dept` | Create department |
| `updateDept` | PUT | `/system/dept` | Update department |
| `delDept` | DELETE | `/system/dept/{deptId}` | Delete department |

## Changelog

- 2026-06-04: Initial module documentation generated
