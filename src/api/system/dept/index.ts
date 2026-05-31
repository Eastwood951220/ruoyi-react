import request, { type ApiResponse } from '@/request'
import type { DeptTreeNode } from './types'

/** 获取部门下拉树列表 */
export function deptTreeSelect() {
  return request.get<ApiResponse<DeptTreeNode[]>>('/system/user/deptTree')
}
