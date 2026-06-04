import request, { type ApiResponse } from '@/request'
import type { DeptForm, DeptQuery, DeptTreeNode, DeptVO } from './types'

/** 获取部门下拉树列表 */
export function deptTreeSelect() {
  return request.get<ApiResponse<DeptTreeNode[]>>('/system/user/deptTree')
}

/** 查询部门列表（树形） */
export function listDept(query?: DeptQuery) {
  return request.get<ApiResponse<DeptVO[]>>('/system/dept/list', query)
}

/** 查询部门详情 */
export function getDept(deptId: number | string) {
  return request.get<ApiResponse<DeptVO>>(`/system/dept/${deptId}`)
}

/** 查询部门列表（排除指定节点及其子节点） */
export function listDeptExcludeChild(deptId: number | string) {
  return request.get<ApiResponse<DeptVO[]>>(`/system/dept/list/exclude/${deptId}`)
}

/** 新增部门 */
export function addDept(data: DeptForm) {
  return request.post<ApiResponse<void>>('/system/dept', data)
}

/** 修改部门 */
export function updateDept(data: DeptForm) {
  return request.put<ApiResponse<void>>('/system/dept', data)
}

/** 删除部门 */
export function delDept(deptId: number | string) {
  return request.delete<ApiResponse<void>>(`/system/dept/${deptId}`)
}
