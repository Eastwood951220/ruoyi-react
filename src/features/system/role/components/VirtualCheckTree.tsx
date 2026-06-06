import Tree from 'rc-tree'
import type { DataNode } from 'rc-tree/lib/interface'
import { Checkbox } from 'antd'

interface VirtualCheckTreeProps {
  treeData: DataNode[]
  checkedKeys: React.Key[]
  halfCheckedKeys: React.Key[]
  checkStrictly: boolean
  height?: number
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

export default function VirtualCheckTree({
  treeData,
  checkedKeys,
  halfCheckedKeys,
  checkStrictly,
  height = 300,
  onCheck,
}: VirtualCheckTreeProps) {
  const treeRef = useRef<InstanceType<typeof Tree>>(null)
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(() =>
    treeData.length > 0 ? collectAllKeys(treeData) : [],
  )

  const handleExpand = useCallback((keys: React.Key[]) => {
    setExpandedKeys(keys)
  }, [])

  const handleCheck = useCallback(
    (checkedKeysArg: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
      if (Array.isArray(checkedKeysArg)) {
        // checkStrictly mode - rc-tree returns flat array
        const newHalf = (treeRef.current as unknown as { getHalfCheckedKeys?: () => React.Key[] })?.getHalfCheckedKeys?.() ?? halfCheckedKeys
        onCheck(checkedKeysArg, newHalf)
      } else {
        // linked mode - rc-tree returns {checked, halfChecked}
        onCheck(checkedKeysArg.checked, checkedKeysArg.halfChecked)
      }
    },
    [halfCheckedKeys, onCheck],
  )

  const handleSelect = useCallback(
    (_: React.Key[], info: { node: { key: React.Key } }) => {
      const nodeKey = info.node.key
      const isChecked = checkedKeys.includes(nodeKey)
      const newChecked = isChecked
        ? checkedKeys.filter((k) => k !== nodeKey)
        : [...checkedKeys, nodeKey]
      onCheck(newChecked, halfCheckedKeys)
    },
    [checkedKeys, halfCheckedKeys, onCheck],
  )

  const handleExpandAll = useCallback(() => {
    setExpandedKeys(collectAllKeys(treeData))
  }, [treeData])

  const handleCollapseAll = useCallback(() => {
    setExpandedKeys([])
  }, [])

  const handleSelectAll = useCallback(() => {
    const allKeys = collectAllKeys(treeData)
    onCheck(allKeys, [])
  }, [treeData, onCheck])

  const handleDeselectAll = useCallback(() => {
    onCheck([], [])
  }, [onCheck])

  const toolbar = useMemo(
    () => (
      <div style={{ marginBottom: 8, display: 'flex', gap: 16 }}>
        <Checkbox onChange={(e) => (e.target.checked ? handleExpandAll() : handleCollapseAll())}>
          展开/折叠
        </Checkbox>
        <Checkbox onChange={(e) => (e.target.checked ? handleSelectAll() : handleDeselectAll())}>
          全选/全不选
        </Checkbox>
      </div>
    ),
    [handleExpandAll, handleCollapseAll, handleSelectAll, handleDeselectAll],
  )

  return (
    <div>
      {toolbar}
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 8 }}>
        {treeData.length === 0 ? (
          <div style={{ color: '#999', textAlign: 'center', padding: 16 }}>加载中，请稍候</div>
        ) : (
          <Tree
            ref={treeRef}
            treeData={treeData}
            checkable
            checkStrictly={checkStrictly}
            checkedKeys={checkedKeys}
            expandedKeys={expandedKeys}
            onExpand={handleExpand}
            onCheck={handleCheck}
            onSelect={handleSelect}
            height={height}
            itemHeight={28}
            style={{ maxHeight: height, overflow: 'auto' }}
          />
        )}
      </div>
    </div>
  )
}
