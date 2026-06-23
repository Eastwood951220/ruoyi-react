/** 登录日志视图对象 */
export interface LoginInfoVO {
  infoId: number | string
  tenantId?: number | string
  userName: string
  status: string
  ipaddr: string
  loginLocation?: string
  browser: string
  os: string
  msg: string
  loginTime: string
  clientKey?: string
  deviceType?: string
}

/** 登录日志查询参数 */
export interface LoginInfoQuery {
  pageNum: number
  pageSize: number
  ipaddr?: string
  userName?: string
  status?: string
  orderByColumn?: string
  isAsc?: string
  beginTime?: string
  endTime?: string
}
