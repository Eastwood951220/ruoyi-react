import request, { download, type ApiResponse } from '@/request'
import type { ConfigForm, ConfigQuery, ConfigVO } from './types'

/** 根据参数键名查询参数值 */
export function getConfigKey(configKey: string) {
  return request.get<ApiResponse<string>>(`/system/config/configKey/${configKey}`)
}

/** 查询参数列表 */
export function listConfig(query: ConfigQuery) {
  return request.get<ApiResponse<ConfigVO[]>>('/system/config/list', query)
}

/** 查询参数详情 */
export function getConfig(configId: number | string) {
  return request.get<ApiResponse<ConfigVO>>(`/system/config/${configId}`)
}

/** 新增参数 */
export function addConfig(data: ConfigForm) {
  return request.post<ApiResponse<void>>('/system/config', data)
}

/** 修改参数 */
export function updateConfig(data: ConfigForm) {
  return request.put<ApiResponse<void>>('/system/config', data)
}

/** 删除参数 */
export function delConfig(configId: number | string | Array<number | string>) {
  const ids = Array.isArray(configId) ? configId.join(',') : configId
  return request.delete<ApiResponse<void>>(`/system/config/${ids}`)
}

/** 刷新参数缓存 */
export function refreshCache() {
  return request.delete<ApiResponse<void>>('/system/config/refreshCache')
}

/** 导出参数 */
export function exportConfig(data: ConfigQuery) {
  return download('/system/config/export', { ...data }, `config_${Date.now()}.xlsx`)
}
