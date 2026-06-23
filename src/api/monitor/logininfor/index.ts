import request, { download, type ApiResponse } from '@/request'
import type { LoginInfoQuery, LoginInfoVO } from './types'

/** 查询登录日志列表 */
export function listLoginInfo(query: LoginInfoQuery) {
  return request.get<ApiResponse<LoginInfoVO[]>>('/monitor/logininfor/list', query)
}

/** 删除登录日志 */
export function delLoginInfo(infoIds: number | string | Array<number | string>) {
  const ids = Array.isArray(infoIds) ? infoIds.join(',') : infoIds
  return request.delete<ApiResponse<void>>(`/monitor/logininfor/${ids}`)
}

/** 清空登录日志 */
export function cleanLoginInfo() {
  return request.delete<ApiResponse<void>>('/monitor/logininfor/clean')
}

/** 解锁用户登录状态 */
export function unlockLoginInfo(userName: string | Array<string>) {
  const names = Array.isArray(userName) ? userName.join(',') : userName
  return request.get<ApiResponse<void>>(`/monitor/logininfor/unlock/${names}`)
}

/** 导出登录日志 */
export function exportLoginInfo(data: LoginInfoQuery) {
  return download('/monitor/logininfor/export', { ...data }, `logininfor_${Date.now()}.xlsx`)
}
