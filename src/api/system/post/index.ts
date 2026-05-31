import request, { type ApiResponse } from '@/request'
import type { PostVO } from './types'

/** 查询岗位下拉列表 */
export function optionselect(deptId?: number | string, postIds?: Array<number | string>) {
  return request.get<ApiResponse<PostVO[]>>('/system/post/optionselect', {
    deptId,
    postIds,
  })
}
