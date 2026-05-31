export interface DictTypeVO {
  dictId: number | string
  dictName: string
  dictType: string
  remark: string
  createTime?: string
}

export interface DictTypeForm {
  dictId?: number | string
  dictName: string
  dictType: string
  remark: string
}

export interface DictTypeQuery {
  dictName?: string
  dictType?: string
  beginTime?: string
  endTime?: string
  pageNum?: number
  pageSize?: number
}
