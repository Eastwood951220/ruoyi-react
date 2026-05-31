import request, { download, type ApiResponse } from '@/request'
import type { UserData, UserForm, UserInfo, UserQuery, UserVO } from './types'

/**
 * 获取当前登录用户的详细信息。
 *
 * 包含用户实体、角色列表和权限集合。
 * 通常在登录成功后、进入页面前调用，
 * 用于初始化用户状态和权限数据。
 */
export function getInfo(): Promise<ApiResponse<UserInfo>> {
  return request({
    url: '/system/user/getInfo',
    method: 'get',
  })
}

/** 查询用户列表 */
export function listUser(query: UserQuery) {
  return request.get<ApiResponse<UserVO[]>>('/system/user/list', query)
}

/** 查询用户详情（含岗位、角色） */
export function getUser(userId?: number | string) {
  const url = userId !== undefined ? `/system/user/${userId}` : '/system/user/'
  return request.get<ApiResponse<UserData>>(url)
}

/** 新增用户 */
export function addUser(data: UserForm) {
  return request.post<ApiResponse<void>>('/system/user', data)
}

/** 修改用户 */
export function updateUser(data: UserForm) {
  return request.put<ApiResponse<void>>('/system/user', data)
}

/** 删除用户 */
export function delUser(userIds: number | string | Array<number | string>) {
  const ids = Array.isArray(userIds) ? userIds.join(',') : userIds
  return request.delete<ApiResponse<void>>(`/system/user/${ids}`)
}

/** 修改用户状态 */
export function changeUserStatus(userId: number | string, status: string) {
  return request.put<ApiResponse<void>>('/system/user/changeStatus', { userId, status })
}

/** 重置用户密码 */
export function resetUserPwd(userId: number | string, password: string) {
  return request.put<ApiResponse<void>>('/system/user/resetPwd', { userId, password })
}

/** 导出用户 */
export function exportUser(data: UserQuery) {
  return download('/system/user/export', { ...data }, `user_${Date.now()}.xlsx`)
}

/** 下载导入模板 */
export function importTemplate() {
  return download('/system/user/importTemplate', {}, `user_template_${Date.now()}.xlsx`)
}

export type { LoginUser, UserInfo } from './types'
