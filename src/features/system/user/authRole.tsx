import { useCallback, useEffect, useRef, useState } from 'react'
import type { Key } from 'react'
import { Button, message, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate, useParams } from '@tanstack/react-router'
import { getAuthRole, updateAuthRole } from '@/api/system/user'
import type { UserVO } from '@/api/system/user/types'
import type { RoleVO } from '@/api/system/role/types'

export default function AuthRolePage() {
  const navigate = useNavigate()
  const { userId } = useParams({ strict: false })

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<Pick<UserVO, 'nickName' | 'userName'> | null>(null)
  const [roles, setRoles] = useState<RoleVO[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const mountedRef = useRef(false)

  const currentUserId = userId && String(userId).length > 0 ? String(userId) : undefined

  const handleClose = useCallback(() => {
    void navigate({ to: '/system/user' })
  }, [navigate])

  const fetchRoles = useCallback(async () => {
    if (!currentUserId) {
      void message.warning('缺少用户编号')
      return
    }

    setLoading(true)
    try {
      const res = await getAuthRole(currentUserId)
      if (!mountedRef.current) return
      const data = res.data
      if (!data) {
        setUser(null)
        setRoles([])
        setSelectedRowKeys([])
        return
      }

      setUser({
        nickName: data.user?.nickName,
        userName: data.user?.userName,
      })
      const nextRoles = data.roles ?? []
      setRoles(nextRoles)
      setSelectedRowKeys(nextRoles.filter((role) => role.flag).map((role) => role.roleId))
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [currentUserId])

  useEffect(() => {
    mountedRef.current = true
    const timer = window.setTimeout(() => {
      void fetchRoles()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      mountedRef.current = false
    }
  }, [fetchRoles])

  const handleConfirm = async () => {
    if (!currentUserId) {
      void message.warning('缺少用户编号')
      return
    }

    setSubmitting(true)
    try {
      await updateAuthRole({
        userId: currentUserId,
        roleIds: selectedRowKeys.join(','),
      })
      message.success('授权成功')
      handleClose()
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
    <div style={{ height: '100%' }}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Space wrap>
          <span>
            用户昵称：<strong>{user?.nickName ?? '-'}</strong>
          </span>
          <span>
            登录账号：<strong>{user?.userName ?? '-'}</strong>
          </span>
        </Space>
        <Space>
          <Button onClick={handleClose}>关闭</Button>
          <Button type="primary" loading={submitting} onClick={handleConfirm}>
            提交
          </Button>
        </Space>
      </div>

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
    </div>
  )
}
