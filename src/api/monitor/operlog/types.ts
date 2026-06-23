/** 操作日志视图对象 */
export interface OperLogVO {
  operId: number | string
  tenantId?: string
  title: string
  businessType: number
  method: string
  requestMethod: string
  operatorType?: number
  operName: string
  deptName?: string
  operUrl: string
  operIp: string
  operLocation?: string
  operParam: string
  jsonResult: string
  status: number
  errorMsg?: string
  operTime: string
  costTime: number
  createTime?: string
}

/** 操作日志查询参数 */
export interface OperLogQuery {
  pageNum: number
  pageSize: number
  operIp?: string
  title?: string
  operName?: string
  businessType?: string
  status?: string
  orderByColumn?: string
  isAsc?: string
  beginTime?: string
  endTime?: string
}
