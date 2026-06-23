import { useMemo } from 'react'
import { Descriptions, Tag } from 'antd'
import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import BaseDrawer from '@/components/BaseDrawer'
import type { OperLogVO } from '@/api/monitor/operlog/types'
import type { DictOption } from '@/store/useDictStore'

interface OperLogDetailDrawerProps {
  open: boolean
  data: OperLogVO | null
  operTypeOptions: DictOption[]
  statusOptions: DictOption[]
  onClose: () => void
}

/** 安全解析 JSON，失败返回原始字符串 */
function safeParseJson(raw: string): unknown {
  if (!raw) return raw
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** 从字典选项中查找 label */
function findDictLabel(options: DictOption[], value: string | number): string {
  const strValue = String(value)
  const option = options.find((o) => o.value === strValue)
  return option?.label ?? strValue
}

export default function OperLogDetailDrawer(props: OperLogDetailDrawerProps) {
  const { open, data, operTypeOptions, onClose } = props

  const operParamJson = useMemo(
    () => (data ? safeParseJson(data.operParam) : null),
    [data],
  )

  const jsonResultJson = useMemo(
    () => (data ? safeParseJson(data.jsonResult) : null),
    [data],
  )

  return (
    <BaseDrawer
      open={open}
      title="操作日志详细"
      width={700}
      footer={null}
      onClose={onClose}
    >
      {data && (
        <Descriptions column={1} bordered styles={{ label: { minWidth: 100 } }}>
          <Descriptions.Item label="操作状态">
            {data.status === 0 ? (
              <Tag color="success">正常</Tag>
            ) : (
              <Tag color="error">失败</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="登录信息">
            {data.operName} / {data.deptName ?? ''} / {data.operIp} / {data.operLocation ?? ''}
          </Descriptions.Item>

          <Descriptions.Item label="请求信息">
            {data.requestMethod} {data.operUrl}
          </Descriptions.Item>

          <Descriptions.Item label="操作模块">
            {data.title} / {findDictLabel(operTypeOptions, data.businessType)}
          </Descriptions.Item>

          <Descriptions.Item label="操作方法">
            {data.method}
          </Descriptions.Item>

          <Descriptions.Item label="请求参数">
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {typeof operParamJson === 'object' && operParamJson !== null ? (
                <JsonView data={operParamJson} shouldExpandNode={allExpanded} style={defaultStyles} />
              ) : (
                <span>{data.operParam}</span>
              )}
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="返回参数">
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {typeof jsonResultJson === 'object' && jsonResultJson !== null ? (
                <JsonView data={jsonResultJson} shouldExpandNode={allExpanded} style={defaultStyles} />
              ) : (
                <span>{data.jsonResult}</span>
              )}
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="消耗时间">
            {data.costTime}ms
          </Descriptions.Item>

          <Descriptions.Item label="操作时间">
            {data.operTime}
          </Descriptions.Item>

          {data.status === 1 && data.errorMsg && (
            <Descriptions.Item label="异常信息">
              <span style={{ color: '#ff4d4f' }}>{data.errorMsg}</span>
            </Descriptions.Item>
          )}
        </Descriptions>
      )}
    </BaseDrawer>
  )
}
