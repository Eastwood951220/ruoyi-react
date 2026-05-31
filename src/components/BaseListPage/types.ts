import type { ColumnsType, TablePaginationConfig, TableProps } from 'antd/es/table'
import type { ReactNode } from 'react'

export interface BaseListPageProps<T extends object> {
  /** 表格行唯一标识 */
  rowKey: TableProps<T>['rowKey']
  /** 表格列配置 */
  columns: ColumnsType<T>
  /** 表格数据源 */
  dataSource: T[]
  /** 表格加载状态 */
  loading?: boolean
  /** 分页配置，false 则不显示分页 */
  pagination?: false | TablePaginationConfig
  /** 行选择配置 */
  rowSelection?: TableProps<T>['rowSelection']
  /** 查询区域内容 */
  queryNode?: ReactNode
  /** 工具栏左侧业务按钮 */
  toolbarLeft?: ReactNode
  /** 透传 Table 其他属性 */
  tableProps?: Omit<TableProps<T>, 'rowKey' | 'columns' | 'dataSource' | 'loading' | 'pagination' | 'rowSelection'>
  /** 刷新回调 */
  onRefresh?: () => void
  /** 查询区域默认是否显示 */
  queryVisibleDefault?: boolean
  /** 列配置本地缓存 key */
  storageKey?: string
}
