export interface ConfigVO {
  configId: number | string
  configName: string
  configKey: string
  configValue: string
  configType: string
  remark?: string
  createTime?: string
}

export interface ConfigForm {
  configId?: number | string
  configName: string
  configKey: string
  configValue: string
  configType: string
  remark?: string
}

export interface ConfigQuery {
  pageNum: number
  pageSize: number
  configName?: string
  configKey?: string
  configType?: string
  beginTime?: string
  endTime?: string
}
