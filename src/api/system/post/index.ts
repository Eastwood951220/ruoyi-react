import request, { download, type ApiResponse } from '@/request'
import type { PostForm, PostQuery, PostVO } from './types'

/** 查询岗位列表 */
export function listPost(query: PostQuery) {
  return request.get<ApiResponse<PostVO[]>>('/system/post/list', query)
}

/** 查询岗位详细 */
export function getPost(postId: number | string) {
  return request.get<ApiResponse<PostVO>>(`/system/post/${postId}`)
}

/** 查询岗位下拉列表 */
export function optionselect(deptId?: number | string, postIds?: Array<number | string>) {
  return request.get<ApiResponse<PostVO[]>>('/system/post/optionselect', { deptId, postIds })
}

/** 新增岗位 */
export function addPost(data: PostForm) {
  return request.post<ApiResponse<void>>('/system/post', data)
}

/** 修改岗位 */
export function updatePost(data: PostForm) {
  return request.put<ApiResponse<void>>('/system/post', data)
}

/** 删除岗位 */
export function delPost(postIds: number | string | Array<number | string>) {
  const ids = Array.isArray(postIds) ? postIds.join(',') : postIds
  return request.delete<ApiResponse<void>>(`/system/post/${ids}`)
}

/** 导出岗位 */
export function exportPost(data: PostQuery) {
  return download('/system/post/export', { ...data }, `post_${Date.now()}.xlsx`)
}

/** 查询部门下拉树结构 */
export function deptTreeSelect() {
  return request.get<ApiResponse<import('@/api/system/dept/types').DeptTreeNode[]>>('/system/post/deptTree')
}
