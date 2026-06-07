import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Popover, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ControlOutlined,
  RedoOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import ColumnSetting from './ColumnSetting'
import type { ColumnSettingItem } from './ColumnSetting'
import type { BaseListPageProps } from './types'
import styles from './index.module.less'

// ---- 工具函数 ----

function getColumnKey(column: ColumnsType<object>[number], index: number): string {
  if ('key' in column && column.key != null) return String(column.key)
  if ('dataIndex' in column && column.dataIndex != null) {
    return Array.isArray(column.dataIndex)
      ? column.dataIndex.join('.')
      : String(column.dataIndex)
  }
  return `column_${index}`
}

function getColumnTitle(column: ColumnsType<object>[number]): string {
  if ('title' in column && typeof column.title === 'string') return column.title
  if ('dataIndex' in column && typeof column.dataIndex === 'string') return column.dataIndex
  return '未知列'
}

function getColumnsSignature(columns: ColumnsType<object>): string {
  return columns
    .map((column, index) => {
      const key = getColumnKey(column, index)
      const title = getColumnTitle(column)
      return `${index}:${key}:${title}`
    })
    .join('|')
}

function isSameColumnSettings(
  current: ColumnSettingItem[],
  next: ColumnSettingItem[],
): boolean {
  if (current.length !== next.length) return false
  return current.every((item, index) => {
    const nextItem = next[index]
    return (
      nextItem != null
      && item.key === nextItem.key
      && item.title === nextItem.title
      && item.visible === nextItem.visible
      && item.order === nextItem.order
      && item.disabled === nextItem.disabled
    )
  })
}

function readStoredSettings(storageKey: string): ColumnSettingItem[] | null {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const valid = parsed.filter(isColumnSettingItem)
    return valid.length === parsed.length ? valid : null
  } catch {
    return null
  }
}

function isColumnSettingItem(value: unknown): value is ColumnSettingItem {
  return (
    typeof value === 'object'
    && value !== null
    && 'key' in value
    && 'visible' in value
    && 'order' in value
    && typeof (value as Record<string, unknown>).key === 'string'
    && typeof (value as Record<string, unknown>).visible === 'boolean'
    && typeof (value as Record<string, unknown>).order === 'number'
  )
}

function writeStoredSettings(storageKey: string, settings: ColumnSettingItem[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

function mergeSettings(
  columns: ColumnsType<object>,
  stored: ColumnSettingItem[] | null,
): ColumnSettingItem[] {
  const defaults: ColumnSettingItem[] = columns.map((col, index) => {
    const key = getColumnKey(col, index)
    return {
      key,
      title: getColumnTitle(col),
      visible: true,
      order: index,
      disabled: key === 'action',
    }
  })

  if (!stored) return defaults

  const storedMap = new Map(stored.map((s) => [s.key, s]))

  return defaults.map((def) => {
    const s = storedMap.get(def.key)
    if (!s) return def
    return {
      ...def,
      title: def.title,
      visible: def.disabled ? true : s.visible,
      order: s.order,
    }
  }).sort((a, b) => a.order - b.order)
}

// ---- 高度 Hook ----

function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const nextHeight = Math.round(entry.contentRect.height)
        setHeight((prev) => (prev === nextHeight ? prev : nextHeight))
      }
    })

    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [])

  return { ref, height }
}

// ---- BaseListPage 组件 ----

export default function BaseListPage<T extends object>(props: BaseListPageProps<T>) {
  const {
    rowKey,
    columns,
    dataSource,
    loading = false,
    pagination,
    rowSelection,
    queryNode,
    toolbarLeft,
    tableProps,
    expandable,
    onRefresh,
    queryVisibleDefault = true,
    storageKey,
  } = props

  const columnsSignature = getColumnsSignature(columns as ColumnsType<object>)
  const latestColumnsRef = useRef<ColumnsType<object>>(columns as ColumnsType<object>)

  // ---- 查询区域显示/隐藏 ----
  const [queryVisible, setQueryVisible] = useState(queryVisibleDefault)

  // ---- 列设置 ----
  const [columnSettings, setColumnSettings] = useState<ColumnSettingItem[]>(() =>
    mergeSettings(columns as ColumnsType<object>, storageKey ? readStoredSettings(storageKey) : null),
  )

  const [settingOpen, setSettingOpen] = useState(false)

  useEffect(() => {
    latestColumnsRef.current = columns as ColumnsType<object>
  }, [columns])

  // 列变化时重新合并
  const settingsSourceRef = useRef({ columnsSignature, storageKey })
  useEffect(() => {
    if (
      settingsSourceRef.current.columnsSignature === columnsSignature
      && settingsSourceRef.current.storageKey === storageKey
    ) {
      return
    }
    settingsSourceRef.current = { columnsSignature, storageKey }
    const stored = storageKey ? readStoredSettings(storageKey) : null
    const nextSettings = mergeSettings(latestColumnsRef.current, stored)
    setColumnSettings((prev) => (
      isSameColumnSettings(prev, nextSettings) ? prev : nextSettings
    ))
  }, [columnsSignature, storageKey])

  const handleToggleVisible = useCallback((key: string) => {
    setColumnSettings((prev) => {
      const next = prev.map((s) =>
        s.key === key && !s.disabled ? { ...s, visible: !s.visible } : s,
      )
      if (storageKey) writeStoredSettings(storageKey, next)
      return next
    })
  }, [storageKey])

  const handleReorder = useCallback((oldIndex: number, newIndex: number) => {
    setColumnSettings((prev) => {
      const next = [...prev]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      const reordered = next.map((s, i) => ({ ...s, order: i }))
      if (storageKey) writeStoredSettings(storageKey, reordered)
      return reordered
    })
  }, [storageKey])

  const handleResetColumns = useCallback(() => {
    const defaults = mergeSettings(latestColumnsRef.current, null)
    setColumnSettings(defaults)
    if (storageKey) writeStoredSettings(storageKey, defaults)
  }, [storageKey])

  // 根据 columnSettings 过滤和排序列
  const visibleColumns = useMemo(() => {
    const columnMap = new Map<string, ColumnsType<object>[number]>()
    ;(columns as ColumnsType<object>).forEach((col, index) => {
      columnMap.set(getColumnKey(col, index), col)
    })
    return columnSettings
      .filter((s) => s.visible)
      .map((s) => columnMap.get(s.key))
      .filter((col): col is ColumnsType<object>[number] => col != null) as ColumnsType<T>
  }, [columns, columnSettings])

  // ---- 表格高度自适应 ----
  const { ref: tableWrapperRef, height: tableWrapperHeight } = useElementHeight<HTMLDivElement>()

  const tableScrollY = useMemo(() => {
    if (tableWrapperHeight <= 0) return undefined
    return tableWrapperHeight - 120
  }, [tableWrapperHeight])

  // ---- 列设置弹层 ----
  const columnSettingContent = useMemo(() => (
    <ColumnSetting
      items={columnSettings}
      onToggleVisible={handleToggleVisible}
      onReorder={handleReorder}
      onReset={handleResetColumns}
    />
  ), [columnSettings, handleToggleVisible, handleReorder, handleResetColumns])

  return (
    <div className={styles.baseListPage}>
      {/* 查询区域 */}
      {queryNode && (
        <Card className={`${styles.queryCard} ${queryVisible ? '' : styles.hidden}`}>
          {queryNode}
        </Card>
      )}

      {/* 列表区域 */}
      <Card className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            {toolbarLeft}
          </div>
          <div className={styles.toolbarRight}>
            {queryNode && (
              <Tooltip title={queryVisible ? '隐藏搜索' : '显示搜索'}>
                <Button
                  type="text"
                  icon={<SearchOutlined />}
                  onClick={() => setQueryVisible((v) => !v)}
                />
              </Tooltip>
            )}
            {onRefresh && (
              <Tooltip title="刷新">
                <Button type="text" icon={<RedoOutlined />} onClick={onRefresh} />
              </Tooltip>
            )}
            {storageKey && (
              <Popover
                content={columnSettingContent}
                trigger="click"
                placement="bottomRight"
                open={settingOpen}
                onOpenChange={setSettingOpen}
              >
                <Tooltip title="列设置">
                  <Button type="text" icon={<ControlOutlined />} />
                </Tooltip>
              </Popover>
            )}
          </div>
        </div>

        <div ref={tableWrapperRef} className={styles.tableWrapper}>
          <Table<T>
            rowKey={rowKey}
            columns={visibleColumns}
            dataSource={dataSource}
            loading={loading}
            pagination={pagination}
            rowSelection={rowSelection}
            expandable={expandable}
            scroll={{ y: tableScrollY, x: 'max-content' }}
            {...tableProps}
          />
        </div>
      </Card>
    </div>
  )
}
