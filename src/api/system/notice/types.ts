/** 公告视图对象 */
export interface NoticeVO {
  noticeId: number
  noticeTitle: string
  noticeType: string
  noticeContent: string
  status: string
  remark: string
  createByName: string
  createTime?: string
}

/** 公告表单对象 */
export interface NoticeForm {
  noticeId?: number | string
  noticeTitle: string
  noticeType: string
  noticeContent: string
  status: string
  remark?: string
}

/** 公告查询参数 */
export interface NoticeQuery {
  pageNum: number
  pageSize: number
  noticeTitle?: string
  createByName?: string
  noticeType?: string
  status?: string
}
