import { useState } from 'react'
import { message, Tree } from 'antd'
import type { Key } from 'react'
import BaseModal from '@/components/BaseModal'
import { cascadeDelMenu } from '@/api/system/menu'

interface CascadeTreeNode {
  key: Key
  title: string
  children?: CascadeTreeNode[]
}

interface CascadeDeleteModalProps {
  open: boolean
  treeData: CascadeTreeNode[]
  onClose: () => void
  onSuccess: () => void
}

export default function CascadeDeleteModal(props: CascadeDeleteModalProps) {
  const { open, treeData, onClose, onSuccess } = props

  const [checkedKeys, setCheckedKeys] = useState<Key[]>([])
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    setCheckedKeys([])
    onClose()
  }

  const handleConfirm = async () => {
    if (checkedKeys.length === 0) {
      message.warning('请选择要删除的菜单')
      return
    }

    const menuIds = checkedKeys.filter((key): key is number | string => (
      typeof key === 'number' || typeof key === 'string'
    ))

    setLoading(true)
    try {
      await cascadeDelMenu(menuIds)
      message.success('删除成功')
      setCheckedKeys([])
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const handleCheck = (checked: Key[] | { checked: Key[] }) => {
    setCheckedKeys(Array.isArray(checked) ? checked : checked.checked)
  }

  return (
    <BaseModal
      open={open}
      title="级联删除菜单"
      width={600}
      confirmLoading={loading}
      onClose={handleClose}
      onConfirm={handleConfirm}
    >
      <Tree
        checkable
        treeData={treeData}
        checkedKeys={checkedKeys}
        onCheck={handleCheck}
        defaultExpandAll
        style={{ maxHeight: 400, overflow: 'auto' }}
      />
    </BaseModal>
  )
}
