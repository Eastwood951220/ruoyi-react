import { useCallback, useState } from 'react'
import { Button, DatePicker, Form, Input, message, Modal, Space, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import type { Dayjs } from 'dayjs'
import AuthButton from '@/components/AuthButton'
import BaseListPage from '@/components/BaseListPage'
import DictSelect from '@/components/DictSelect'
import { useDict } from '@/hooks/useDict'
import { useTableList } from '@/hooks/useTableList'
import {
  listRole,
  delRole,
  changeRoleStatus,
  exportRole,
} from '@/api/system/role'
import type { RoleQuery, RoleVO } from '@/api/system/role/types'
import RoleDrawer from './components/RoleDrawer'
import DataScopeDrawer from './components/DataScopeDrawer'
import styles from './index.module.less'

const { RangePicker } = DatePicker

type RoleSearchForm = {
  roleName?: string
  roleKey?: string
  status?: string
  dateRange?: [Dayjs, Dayjs] | null
}

type RoleListParams = Omit<RoleQuery, 'pageNum' | 'pageSize'>

export default function RolePage() {
  const navigate = useNavigate()
  const { sys_normal_disable } = useDict('sys_normal_disable')

  const [form] = Form.useForm<RoleSearchForm>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRoleId, setEditRoleId] = useState<number | string | undefined>()
  const [dataScopeOpen, setDataScopeOpen] = useState(false)
  const [dataScopeRoleId, setDataScopeRoleId] = useState<number | string | undefined>()

  const buildQueryParams = useCallback((formValues: RoleSearchForm): RoleListParams => {
    const params: RoleListParams = {
      roleName: formValues.roleName ?? '',
      roleKey: formValues.roleKey ?? '',
      status: formValues.status ?? '',
    }
    if (formValues.dateRange?.[0] && formValues.dateRange?.[1]) {
      params.beginTime = formValues.dateRange[0].format('YYYY-MM-DD HH:mm:ss')
      params.endTime = formValues.dateRange[1].format('YYYY-MM-DD HH:mm:ss')
    }
    return params
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
  } = useTableList<RoleVO, RoleSearchForm, RoleListParams>({
    form,
    request: listRole,
    buildParams: buildQueryParams,
  })

  const handleDelete = (roleIds: number | string | Array<number | string>) => {
    const ids = Array.isArray(roleIds) ? roleIds : [roleIds]
    const label = ids.length === 1 ? `角色编号为"${ids[0]}"` : `选中的${ids.length}条数据`
    Modal.confirm({
      title: '系统提示',
      content: `是否确认删除${label}？`,
      onOk: async () => {
        await delRole(ids)
        message.success('删除成功')
        setSelectedRowKeys([])
        refresh()
      },
    })
  }

  const handleStatusChange = (row: RoleVO) => {
    const newStatus = row.status === '0' ? '1' : '0'
    const text = newStatus === '0' ? '启用' : '停用'
    Modal.confirm({
      title: '系统提示',
      content: `确认要${text}"${row.roleName}"角色吗？`,
      onOk: async () => {
        await changeRoleStatus(row.roleId, newStatus)
        message.success('修改成功')
        refresh()
      },
      onCancel: () => refresh(),
    })
  }

  const handleExport = () => {
    const formValues = form.getFieldsValue()
    const params: RoleQuery = {
      ...buildQueryParams(formValues),
      pageNum,
      pageSize,
    }
    void exportRole(params)
  }

  const handleAdd = () => { setEditRoleId(undefined); setDrawerOpen(true) }
  const handleEdit = (roleId: number | string) => { setEditRoleId(roleId); setDrawerOpen(true) }
  const handleDrawerClose = () => { setDrawerOpen(false); setEditRoleId(undefined) }
  const handleDrawerSuccess = () => { setDrawerOpen(false); setEditRoleId(undefined); refresh() }

  const handleDataScope = (row: RoleVO) => { setDataScopeRoleId(row.roleId); setDataScopeOpen(true) }
  const handleDataScopeClose = () => { setDataScopeOpen(false); setDataScopeRoleId(undefined) }
  const handleDataScopeSuccess = () => { setDataScopeOpen(false); setDataScopeRoleId(undefined) }

  const handleAuthUser = (row: RoleVO) => {
    void navigate({ to: '/system/role-auth/$roleId', params: { roleId: String(row.roleId) } })
  }

  const single = selectedRowKeys.length !== 1
  const multiple = selectedRowKeys.length === 0

  const queryNode = (
    <Form form={form} layout="inline">
      <Form.Item name="roleName"><Input placeholder="角色名称" allowClear /></Form.Item>
      <Form.Item name="roleKey"><Input placeholder="权限字符" allowClear /></Form.Item>
      <Form.Item name="status">
        <DictSelect options={sys_normal_disable} placeholder="状态" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="dateRange">
        <RangePicker />
      </Form.Item>
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
      <AuthButton type="primary" icon={<PlusOutlined />} permission="system:role:add" onClick={handleAdd}>新增</AuthButton>
      <AuthButton permission="system:role:edit" disabled={single} onClick={() => handleEdit(selectedRowKeys[0])}>修改</AuthButton>
      <AuthButton danger permission="system:role:remove" disabled={multiple} onClick={() => handleDelete(selectedRowKeys)}>删除</AuthButton>
      <AuthButton permission="system:role:export" onClick={handleExport}>导出</AuthButton>
    </>
  )

  const columns: ColumnsType<RoleVO> = [
    { title: '角色名称', dataIndex: 'roleName', width: 150, ellipsis: true },
    { title: '权限字符', dataIndex: 'roleKey', width: 200, ellipsis: true },
    { title: '显示顺序', dataIndex: 'roleSort', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Switch
          checked={record.status === '0'}
          checkedChildren="正常"
          unCheckedChildren="停用"
          onChange={() => handleStatusChange(record)}
        />
      ),
    },
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => {
        if (record.roleId === 1) return null
        return (
          <Space size="small">
            <AuthButton type="link" size="small" permission="system:role:edit" onClick={() => handleEdit(record.roleId)}>修改</AuthButton>
            <AuthButton type="link" size="small" danger permission="system:role:remove" onClick={() => handleDelete(record.roleId)}>删除</AuthButton>
            <AuthButton type="link" size="small" permission="system:role:edit" onClick={() => handleDataScope(record)}>数据权限</AuthButton>
            <AuthButton type="link" size="small" permission="system:role:edit" onClick={() => handleAuthUser(record)}>分配用户</AuthButton>
          </Space>
        )
      },
    },
  ]

  return (
    <div className={styles.page}>
      <BaseListPage<RoleVO>
        rowKey="roleId"
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
        storageKey="system-role-columns"
      />

      <RoleDrawer
        open={drawerOpen}
        roleId={editRoleId}
        statusOptions={sys_normal_disable}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />

      <DataScopeDrawer
        open={dataScopeOpen}
        roleId={dataScopeRoleId}
        onClose={handleDataScopeClose}
        onSuccess={handleDataScopeSuccess}
      />
    </div>
  )
}
