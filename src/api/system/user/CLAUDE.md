[root](../../../CLAUDE.md) > [api](../../) > [system](../) > **user**

# User API

## Responsibility

User management CRUD operations, status changes, password reset, import/export.

## Entry Point

`src/api/system/user/index.ts`

## Exports

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getInfo` | GET | `/system/user/getInfo` | Get current user info (roles, permissions) |
| `listUser` | GET | `/system/user/list` | Query user list (paginated) |
| `getUser` | GET | `/system/user/{userId}` | Get user detail (with posts, roles) |
| `addUser` | POST | `/system/user` | Create user |
| `updateUser` | PUT | `/system/user` | Update user |
| `delUser` | DELETE | `/system/user/{ids}` | Delete users |
| `changeUserStatus` | PUT | `/system/user/changeStatus` | Toggle user status |
| `resetUserPwd` | PUT | `/system/user/resetPwd` | Reset user password |
| `exportUser` | POST | `/system/user/export` | Export users to Excel |
| `importTemplate` | GET | `/system/user/importTemplate` | Download import template |
| `listUserByDeptId` | GET | `/system/user/list/dept/{deptId}` | Users in specific department |

## Types (types.ts)

- `UserVO` -- user list item
- `UserForm` -- user create/update form
- `UserQuery` -- list query parameters
- `UserData` -- user detail (with posts, roles, postIds, roleIds)
- `UserInfo` -- current user info (user, roles, permissions)
- `LoginUser` -- login user entity

## Changelog

- 2026-06-04: Initial module documentation generated
