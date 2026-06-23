import request, { type ApiResponse } from '@/request'
import type { NoticeForm, NoticeQuery, NoticeVO } from './types'

/** 查询公告列表 */
export function listNotice(query: NoticeQuery) {
  return request.get<ApiResponse<NoticeVO[]>>('/system/notice/list', query)
}

/** 查询公告详细 */
export function getNotice(noticeId: number | string) {
  return request.get<ApiResponse<NoticeVO>>(`/system/notice/${noticeId}`)
}

/** 新增公告 */
export function addNotice(data: NoticeForm) {
  return request.post<ApiResponse<void>>('/system/notice', data)
}

/** 修改公告 */
export function updateNotice(data: NoticeForm) {
  return request.put<ApiResponse<void>>('/system/notice', data)
}

/** 删除公告 */
export function delNotice(noticeIds: number | string | Array<number | string>) {
  const ids = Array.isArray(noticeIds) ? noticeIds.join(',') : noticeIds
  return request.delete<ApiResponse<void>>(`/system/notice/${ids}`)
}
