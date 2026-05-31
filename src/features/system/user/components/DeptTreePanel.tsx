import { useState } from 'react'
import { Card, Input, Tree } from 'antd'
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

export default function DeptTreePanel(props: DeptTreePanelProps) {
  const { data, selectedDeptId, loading, onSelectDept } = props
  const [filterValue, setFilterValue] = useState('')

  const treeData = convertToTreeData(data)

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
      styles={{ body: { padding: '12px', height: 'calc(100% - 56px)', overflow: 'auto' } }}
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
      <Tree
        treeData={treeData}
        selectedKeys={selectedDeptId !== undefined ? [selectedDeptId] : []}
        onSelect={handleSelect}
        filterTreeNode={filterTreeNode}
        showLine
        defaultExpandAll
      />
    </Card>
  )
}
