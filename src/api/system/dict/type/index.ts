import request, {type ApiResponse, download} from '@/request'

import type {DictTypeForm, DictTypeQuery, DictTypeVO} from './types'

/** 查询字典类型列表 */
export function listType(query: DictTypeQuery) {
	return request.get<ApiResponse<DictTypeVO[]>>('/system/dict/type/list', query)
}

/** 查询字典类型详情 */
export function getType(dictId: number | string) {
	return request.get<ApiResponse<DictTypeVO>>(`/system/dict/type/${dictId}`)
}

/** 新增字典类型 */
export function addType(data: DictTypeForm) {
	return request.post<ApiResponse<void>>('/system/dict/type', data)
}

/** 修改字典类型 */
export function updateType(data: DictTypeForm) {
	return request.put<ApiResponse<void>>('/system/dict/type', data)
}

/** 删除字典类型 */
export function delType(dictId: number | string | Array<number | string>) {
	const ids = Array.isArray(dictId) ? dictId.join(',') : dictId
	return request.delete<ApiResponse<void>>(`/system/dict/type/${ids}`)
}

/** 刷新字典缓存 */
export function refreshCache() {
	return request.delete<ApiResponse<void>>('/system/dict/type/refreshCache')
}

/** 导出字典类型 */
export function exportType(data: DictTypeQuery) {
	return download('/system/dict/type/export', {
		...data
	}, `dict_${Date.now()}.xlsx`)
}
