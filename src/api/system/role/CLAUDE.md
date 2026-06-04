[root](../../../CLAUDE.md) > [api](../../) > [system](../) > **role**

# Role API

## Responsibility

Role management CRUD, data scope assignment, menu tree, and user-role assignment.

## Entry Point

`src/api/system/role/index.ts`

## Exports

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `listRole` | GET | `/system/role/list` | Query role list |
| `getRole` | GET | `/system/role/{roleId}` | Get role detail |
| `addRole` | POST | `/system/role` | Create role |
| `updateRole` | PUT | `/system/role` | Update role |
| `delRole` | DELETE | `/system/role/{ids}` | Delete roles |
| `changeRoleStatus` | PUT | `/system/role/changeStatus` | Toggle role status |
| `dataScope` | PUT | `/system/role/dataScope` | Update data scope |
| `deptTreeSelect` | GET | `/system/role/deptTree/{roleId}` | Get role department tree |
| `roleMenuTreeselect` | GET | `/system/menu/roleMenuTreeselect/{roleId}` | Get role menu tree |
| `menuTreeselect` | GET | `/system/menu/treeselect` | Get full menu tree |
| `exportRole` | POST | `/system/role/export` | Export roles to Excel |
| `allocatedUserList` | GET | `/system/role/authUser/allocatedList` | Users assigned to role |
| `unallocatedUserList` | GET | `/system/role/authUser/unallocatedList` | Users not assigned to role |
| `authUserCancel` | PUT | `/system/role/authUser/cancel` | Remove user from role |
| `authUserCancelAll` | PUT | `/system/role/authUser/cancelAll` | Remove multiple users from role |
| `authUserSelectAll` | PUT | `/system/role/authUser/selectAll` | Assign multiple users to role |

## Changelog

- 2026-06-04: Initial module documentation generated
