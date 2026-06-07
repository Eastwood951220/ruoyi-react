import { useCallback, useEffect, useRef, useState } from 'react'
import { message, Modal, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getAuthRole, updateAuthRole } from '@/api/system/user'
import type { UserVO } from '@/api/system/user/types'
import type { RoleVO } from '@/api/system/role/types'

interface AuthRoleModalProps {
  open: boolean
  userId?: number | string
  onClose: () => void
  onSuccess: () => void
}

export default function AuthRoleModal(props: AuthRoleModalProps) {
  const { open, userId, onClose, onSuccess } = props

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<Pick<UserVO, 'nickName' | 'userName'> | null>(null)
  const [roles, setRoles] = useState<RoleVO[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const fetchedRef = useRef(false)

  const fetchRoles = useCallback(async () => {
    if (userId === undefined) return
    setLoading(true)
    try {
      const res = await getAuthRole(userId)
      const data = res.data
      if (data) {
        setUser({ nickName: data.user?.nickName, userName: data.user?.userName })
        setRoles(data.roles ?? [])
        // 默认选中已分配的角色（flag 为 true）
        const defaultSelected = (data.roles ?? [])
          .filter((role) => role.flag)
          .map((role) => role.roleId)
        setSelectedRowKeys(defaultSelected)
      }
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!open) return
    if (fetchedRef.current) return
    fetchedRef.current = true
    void fetchRoles()
  }, [open, fetchRoles])

  const handleClose = () => {
    fetchedRef.current = false
    setUser(null)
    setRoles([])
    setSelectedRowKeys([])
    onClose()
  }

  const handleConfirm = async () => {
    if (userId === undefined) return
    setSubmitting(true)
    try {
      const roleIds = selectedRowKeys.join(',')
      await updateAuthRole({ userId, roleIds })
      message.success('授权成功')
      handleClose()
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<RoleVO> = [
    { title: '角色编号', dataIndex: 'roleId', key: 'roleId', width: 100 },
    { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
    { title: '权限字符', dataIndex: 'roleKey', key: 'roleKey' },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  ]

  return (
    <Modal
      title="分配角色"
      open={open}
      width={700}
      confirmLoading={submitting}
      onCancel={handleClose}
      onOk={handleConfirm}
      destroyOnHidden
    >
      {user && (
        <div className="mb-4">
          <span className="mr-6">
            用户昵称：<strong>{user.nickName}</strong>
          </span>
          <span>
            登录账号：<strong>{user.userName}</strong>
          </span>
        </div>
      )}
      <Table<RoleVO>
        rowKey="roleId"
        columns={columns}
        dataSource={roles}
        loading={loading}
        pagination={false}
        size="small"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          getCheckboxProps: (record) => ({
            disabled: record.status !== '0',
          }),
        }}
      />
    </Modal>
  )
}
