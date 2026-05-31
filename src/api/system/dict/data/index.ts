import request, {download, type ApiResponse } from '@/request'
import type { DictDataForm, DictDataQuery, DictDataVO } from './types'

/** 根据字典类型获取字典数据列表（不分页，用于下拉选项） */
export function getDicts(dictType: string) {
  return request.get<ApiResponse<DictDataVO[]>>(`/system/dict/data/type/${dictType}`)
}

/** 查询字典数据列表（分页） */
export function listData(query: DictDataQuery) {
  return request.get<ApiResponse<DictDataVO[]>>('/system/dict/data/list', query)
}

/** 查询字典数据详情 */
export function getData(dictCode: number | string) {
  return request.get<ApiResponse<DictDataVO>>(`/system/dict/data/${dictCode}`)
}

/** 新增字典数据 */
export function addData(data: DictDataForm) {
  return request.post<ApiResponse<void>>('/system/dict/data', data)
}

/** 修改字典数据 */
export function updateData(data: DictDataForm) {
  return request.put<ApiResponse<void>>('/system/dict/data', data)
}

/** 删除字典数据 */
export function delData(dictCode: number | string | Array<number | string>) {
  const ids = Array.isArray(dictCode) ? dictCode.join(',') : dictCode
  return request.delete<ApiResponse<void>>(`/system/dict/data/${ids}`)
}

/** 导出字典数据 */
export function exportData(data: DictDataQuery) {
  return download('/system/dict/data/export', {
	  ...data
  }, `dict_data_${Date.now()}.xlsx`)
}
