import request, { download, type ApiResponse } from '@/request'
import type { OperLogQuery, OperLogVO } from './types'

/** 查询操作日志列表 */
export function listOperLog(query: OperLogQuery) {
  return request.get<ApiResponse<OperLogVO[]>>('/monitor/operlog/list', query)
}

/** 删除操作日志 */
export function delOperLog(operIds: number | string | Array<number | string>) {
  const ids = Array.isArray(operIds) ? operIds.join(',') : operIds
  return request.delete<ApiResponse<void>>(`/monitor/operlog/${ids}`)
}

/** 清空操作日志 */
export function cleanOperLog() {
  return request.delete<ApiResponse<void>>('/monitor/operlog/clean')
}

/** 导出操作日志 */
export function exportOperLog(data: OperLogQuery) {
  return download('/monitor/operlog/export', { ...data }, `operlog_${Date.now()}.xlsx`)
}
