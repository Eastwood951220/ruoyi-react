import { useCallback, useState } from 'react'
import { Card, Empty, Input, Switch, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import type { DeptTreeNode } from '@/api/system/dept/types'

interface DeptTreePanelProps {
  data: DeptTreeNode[]
  selectedDeptId?: number | string
  loading?: boolean
  onSelectDept: (deptId: number | string | undefined) => void
}

function convertToTreeData(nodes: DeptTreeNode[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.label,
    disabled: node.disabled,
    children: node.children ? convertToTreeData(node.children) : undefined,
  }))
}

function collectFirstLevelExpandedKeys(nodes: DataNode[]): React.Key[] {
  return nodes.filter((node) => node.children?.length).map((node) => node.key)
}

function collectExpandableKeys(nodes: DataNode[]): React.Key[] {
  const keys: React.Key[] = []
  const walk = (list: DataNode[]) => {
    for (const node of list) {
      if (node.children?.length) {
        keys.push(node.key)
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return keys
}

export default function DeptTreePanel(props: DeptTreePanelProps) {
  const { data, selectedDeptId, loading, onSelectDept } = props
  const [filterValue, setFilterValue] = useState('')
  const treeData = convertToTreeData(data)

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(() =>
    collectFirstLevelExpandedKeys(treeData),
  )
  const [expandedAll, setExpandedAll] = useState(false)

  const handleExpand = useCallback(
    (keys: React.Key[]) => {
      setExpandedKeys(keys)
      const expandableKeys = collectExpandableKeys(treeData)
      setExpandedAll(expandableKeys.length > 0 && keys.length >= expandableKeys.length)
    },
    [treeData],
  )

  const handleExpandSwitchChange = useCallback(
    (checked: boolean) => {
      setExpandedAll(checked)
      setExpandedKeys(
        checked ? collectExpandableKeys(treeData) : collectFirstLevelExpandedKeys(treeData),
      )
    },
    [treeData],
  )

  const filterTreeNode = (node: DataNode): boolean => {
    if (!filterValue) return true
    const title = String(node.title ?? '')
    return title.includes(filterValue)
  }

  const handleSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0]
    onSelectDept(key !== undefined ? (key as number | string) : undefined)
  }

  return (
    <Card
      title="部门列表"
      size="small"
      styles={{ body: { padding: '12px', height: 'calc(100% - 56px)', overflow: 'hidden' } }}
      style={{ height: '100%' }}
      loading={loading}
    >
      <Input.Search
        placeholder="请输入部门名称"
        allowClear
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <div className="mb-2 flex items-center justify-end gap-2">
        <span className="text-sm text-gray-500">展开/折叠</span>
        <Switch checked={expandedAll} size="small" onChange={handleExpandSwitchChange} />
      </div>
      <div style={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
        {treeData.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Tree
            treeData={treeData}
            selectedKeys={selectedDeptId !== undefined ? [selectedDeptId] : []}
            expandedKeys={expandedKeys}
            onExpand={handleExpand}
            onSelect={handleSelect}
            filterTreeNode={filterTreeNode}
            showLine
            height={400}
          />
        )}
      </div>
    </Card>
  )
}
