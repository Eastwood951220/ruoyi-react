import request, { download, type ApiResponse } from '@/request'
import type { RoleForm, RoleQuery, RoleVO, RoleDeptTree, RoleMenuTree, RoleUserQuery } from './types'
import type { UserVO } from '@/api/system/user/types'

/** 查询角色列表 */
export function listRole(query: RoleQuery) {
  return request.get<ApiResponse<RoleVO[]>>('/system/role/list', query)
}

/** 查询角色详情 */
export function getRole(roleId: number | string) {
  return request.get<ApiResponse<RoleVO>>(`/system/role/${roleId}`)
}

/** 新增角色 */
export function addRole(data: RoleForm) {
  return request.post<ApiResponse<void>>('/system/role', data)
}

/** 修改角色 */
export function updateRole(data: RoleForm) {
  return request.put<ApiResponse<void>>('/system/role', data)
}

/** 删除角色 */
export function delRole(roleId: number | string | Array<number | string>) {
  const ids = Array.isArray(roleId) ? roleId.join(',') : roleId
  return request.delete<ApiResponse<void>>(`/system/role/${ids}`)
}

/** 修改角色状态 */
export function changeRoleStatus(roleId: number | string, status: string) {
  return request.put<ApiResponse<void>>('/system/role/changeStatus', { roleId, status })
}

/** 修改数据权限 */
export function dataScope(data: RoleForm) {
  return request.put<ApiResponse<void>>('/system/role/dataScope', data)
}

/** 获取角色部门树 */
export function deptTreeSelect(roleId: number | string) {
  return request.get<RoleDeptTree>(`/system/role/deptTree/${roleId}`)
}

/** 获取角色菜单树 */
export function roleMenuTreeselect(roleId: number | string) {
  return request.get<RoleMenuTree>(`/system/menu/roleMenuTreeselect/${roleId}`)
}

/** 获取菜单树 */
export function menuTreeselect() {
  return request.get<RoleMenuTree>('/system/menu/treeselect')
}

/** 导出角色 */
export function exportRole(data: RoleQuery) {
  return download('/system/role/export', { ...data }, `role_${Date.now()}.xlsx`)
}

// ---- 角色分配用户 ----

/** 查询已分配用户列表 */
export function allocatedUserList(query: RoleUserQuery) {
  return request.get<ApiResponse<UserVO[]>>('/system/role/authUser/allocatedList', query)
}

/** 查询未分配用户列表 */
export function unallocatedUserList(query: RoleUserQuery) {
  return request.get<ApiResponse<UserVO[]>>('/system/role/authUser/unallocatedList', query)
}

/** 取消用户授权 */
export function authUserCancel(data: { userId: number | string; roleId: number | string }) {
  return request.put<ApiResponse<void>>('/system/role/authUser/cancel', data)
}

/** 批量取消用户授权 */
export function authUserCancelAll(data: { roleId: number | string; userIds: string }) {
  return request.put<ApiResponse<void>>('/system/role/authUser/cancelAll', data)
}

/** 批量选择用户授权 */
export function authUserSelectAll(data: { roleId: number | string; userIds: string }) {
  return request.put<ApiResponse<void>>('/system/role/authUser/selectAll', data)
}
