import { useCallback, useState } from 'react'
import { Button, Form, Input, message, Modal, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from '@tanstack/react-router'
import AuthButton from '@/components/AuthButton'
import BaseListPage from '@/components/BaseListPage'
import DictTag from '@/components/DictTag'
import { useDict } from '@/hooks/useDict'
import { useTableList } from '@/hooks/useTableList'
import {
  allocatedUserList,
  authUserCancel,
  authUserCancelAll,
} from '@/api/system/role'
import type { RoleUserQuery } from '@/api/system/role/types'
import type { UserVO } from '@/api/system/user/types'
import SelectUserModal from './components/SelectUserModal'

type AuthUserSearchForm = {
  userName?: string
  phonenumber?: string
}

type AuthUserListParams = Omit<RoleUserQuery, 'pageNum' | 'pageSize'>

export default function AuthUserPage() {
  const navigate = useNavigate()
  const { roleId } = useParams({ strict: false })
  const { sys_normal_disable } = useDict('sys_normal_disable')

  const [form] = Form.useForm<AuthUserSearchForm>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])
  const [selectUserOpen, setSelectUserOpen] = useState(false)

  const buildQueryParams = useCallback((formValues: AuthUserSearchForm): AuthUserListParams => ({
    roleId: roleId ?? '',
    userName: formValues.userName ?? '',
    phonenumber: formValues.phonenumber ?? '',
  }), [roleId])

  const requestAllocatedUsers = useCallback((params: RoleUserQuery) => {
    if (!params.roleId) {
      return Promise.resolve({ rows: [], total: 0 })
    }
    return allocatedUserList(params)
  }, [])

  const {
    dataList,
    total,
    loading,
    pageNum,
    pageSize,
    search: handleSearch,
    reset: handleReset,
    refresh,
    changePage,
  } = useTableList<UserVO, AuthUserSearchForm, AuthUserListParams>({
    form,
    request: requestAllocatedUsers,
    buildParams: buildQueryParams,
    reloadKey: roleId ?? '',
  })

  const requireRoleId = () => {
    if (!roleId) {
      message.warning('缺少角色编号')
      return undefined
    }
    return roleId
  }

  const handleCancelAuth = (row: UserVO) => {
    const currentRoleId = requireRoleId()
    if (!currentRoleId) return
    Modal.confirm({
      title: '系统提示',
      content: `确认要取消"${row.userName}"用户的授权吗？`,
      onOk: async () => {
        await authUserCancel({ userId: row.userId, roleId: currentRoleId })
        message.success('取消授权成功')
        refresh()
      },
    })
  }

  const handleCancelAuthAll = () => {
    const currentRoleId = requireRoleId()
    if (!currentRoleId) return
    if (selectedRowKeys.length === 0) return
    Modal.confirm({
      title: '系统提示',
      content: `确认要取消选中的${selectedRowKeys.length}个用户的授权吗？`,
      onOk: async () => {
        await authUserCancelAll({ roleId: currentRoleId, userIds: selectedRowKeys.join(',') })
        message.success('取消授权成功')
        setSelectedRowKeys([])
        refresh()
      },
    })
  }

  const handleClose = () => {
    void navigate({ to: '/system/role' })
  }

  const multiple = selectedRowKeys.length === 0

  const queryNode = (
    <Form form={form} layout="inline">
      <Form.Item name="userName"><Input placeholder="用户名称" allowClear /></Form.Item>
      <Form.Item name="phonenumber"><Input placeholder="手机号码" allowClear /></Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={() => handleSearch()}>搜索</Button>
          <Button onClick={() => handleReset()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )

  const toolbarLeft = (
    <>
      <AuthButton type="primary" icon={<PlusOutlined />} permission="system:role:add" onClick={() => setSelectUserOpen(true)}>
        添加用户
      </AuthButton>
      <AuthButton danger icon={<CloseOutlined />} permission="system:role:remove" disabled={multiple} onClick={handleCancelAuthAll}>
        批量取消授权
      </AuthButton>
      <Button onClick={handleClose}>关闭</Button>
    </>
  )

  const columns: ColumnsType<UserVO> = [
    { title: '用户名称', dataIndex: 'userName', ellipsis: true },
    { title: '用户昵称', dataIndex: 'nickName', ellipsis: true },
    { title: '邮箱', dataIndex: 'email', ellipsis: true },
    { title: '手机', dataIndex: 'phonenumber', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      align: 'center',
      render: (value: string) => <DictTag options={sys_normal_disable} value={value} />,
    },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <AuthButton type="link" size="small" danger permission="system:role:remove" onClick={() => handleCancelAuth(record)}>
          取消授权
        </AuthButton>
      ),
    },
  ]

  return (
    <div style={{ height: '100%' }}>
      <BaseListPage<UserVO>
        rowKey="userId"
        columns={columns}
        dataSource={dataList}
        loading={loading}
        pagination={{
          current: pageNum, pageSize, total,
          showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
          onChange: changePage,
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as Array<number | string>),
        }}
        queryNode={queryNode}
        toolbarLeft={toolbarLeft}
        onRefresh={refresh}
        storageKey="system-role-auth-user-columns"
      />

      <SelectUserModal
        open={selectUserOpen}
        roleId={roleId}
        onClose={() => setSelectUserOpen(false)}
        onSuccess={() => {
          setSelectUserOpen(false)
          refresh()
        }}
      />
    </div>
  )
}
