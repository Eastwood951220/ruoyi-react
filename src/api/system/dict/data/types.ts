export type DictDataListClass = 'default' | 'primary' | 'success' | 'info' | 'warning' | 'danger'

export interface DictDataVO {
  dictCode?: number | string
  dictSort?: number
  dictLabel: string
  dictValue: string
  dictType?: string
  cssClass?: string
  listClass?: DictDataListClass
  isDefault?: string
  status?: string
  remark?: string
  createTime?: string
}

export interface DictDataForm {
  dictCode?: number | string
  dictType: string
  dictLabel: string
  dictValue: string
  cssClass: string
  listClass: DictDataListClass
  dictSort: number
  remark: string
}

export interface DictDataQuery {
  dictType?: string
  dictLabel?: string
  pageNum?: number
  pageSize?: number
}
