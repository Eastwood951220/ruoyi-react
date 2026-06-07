import { Checkbox, Empty, Spin, Switch, Tree } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import type { DataNode, TreeProps } from 'antd/es/tree'
import React from "react";

interface VirtualCheckTreeProps {
  treeData: DataNode[]
  checkedKeys: React.Key[]
  halfCheckedKeys: React.Key[]
  loading?: boolean
  height?: number
  strictControlLabel?: string
  onCheck: (checkedKeys: React.Key[], halfCheckedKeys: React.Key[]) => void
}

function collectAllKeys(nodes: DataNode[]): React.Key[] {
  const keys: React.Key[] = []
  const walk = (list: DataNode[]) => {
    for (const node of list) {
      keys.push(node.key)
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return keys
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

export default function VirtualCheckTree({
  treeData,
  checkedKeys,
  halfCheckedKeys,
  loading = false,
  height = 300,
  strictControlLabel = '父子联动',
  onCheck,
}: VirtualCheckTreeProps) {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(() => collectFirstLevelExpandedKeys(treeData))
  const [expandedAll, setExpandedAll] = useState(false)
  const [checkStrictlyValue, setCheckStrictlyValue] = useState(true)
  const checkStrictly = !checkStrictlyValue
	

  const handleExpand = useCallback<NonNullable<TreeProps['onExpand']>>((keys) => {
    setExpandedKeys(keys)
    const expandableKeys = collectExpandableKeys(treeData)
    setExpandedAll(expandableKeys.length > 0 && keys.length >= expandableKeys.length)
  }, [treeData])

  const handleExpandSwitchChange = useCallback((checked: boolean) => {
    setExpandedAll(checked)
    setExpandedKeys(checked ? collectExpandableKeys(treeData) : collectFirstLevelExpandedKeys(treeData))
  }, [treeData])

  const handleCheckStrictlyValueChange = useCallback((e: CheckboxChangeEvent) => {
    setCheckStrictlyValue(e.target.checked)
  }, [])

  const handleCheck = useCallback<NonNullable<TreeProps['onCheck']>>(
    (checkedKeysArg, info) => {
      if (Array.isArray(checkedKeysArg)) {
        onCheck(checkedKeysArg, info.halfCheckedKeys ?? [])
      } else {
        onCheck(checkedKeysArg.checked, checkedKeysArg.halfChecked)
      }
    },
    [onCheck],
  )

  const handleSelectAll = useCallback(() => {
    const allKeys = collectAllKeys(treeData)
    onCheck(allKeys, [])
  }, [treeData, onCheck])

  const handleDeselectAll = useCallback(() => {
    onCheck([], [])
  }, [onCheck])

  const treeCheckedKeys: TreeProps['checkedKeys'] = checkStrictly
    ? { checked: checkedKeys, halfChecked: halfCheckedKeys }
    : checkedKeys

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Checkbox checked={checkStrictlyValue} onChange={handleCheckStrictlyValueChange}>
            {strictControlLabel}
          </Checkbox>
          <Checkbox onChange={(e) => (e.target.checked ? handleSelectAll() : handleDeselectAll())}>
            全选/全不选
          </Checkbox>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">展开/折叠</span>
          <Switch checked={expandedAll} size="small" onChange={handleExpandSwitchChange} />
        </div>
      </div>
      <div className="rounded-md border border-gray-200 p-2">
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Spin />
          </div>
        ) : treeData.length === 0 ? (
	          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Tree
            treeData={treeData}
            checkable
            checkStrictly={checkStrictly}
            checkedKeys={treeCheckedKeys}
            expandedKeys={expandedKeys}
            onExpand={handleExpand}
            onCheck={handleCheck}
            height={height}
            selectable={false}
            blockNode
          />
        )}
      </div>
    </div>
  )
}
