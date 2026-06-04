import { useState } from 'react'
import { Button, DatePicker, Dropdown, Form, Input, message, Modal, Space, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FormOutlined,
  ImportOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import AuthButton from '@/components/AuthButton'
import Auth from '@/components/Auth'
import BaseListPage from '@/components/BaseListPage'
import DictSelect from '@/components/DictSelect'
import { useDict } from '@/hooks/useDict'
import type { UserVO } from '@/api/system/user/types'
import { useUserPage } from './hooks/useUserPage'
import DeptTreePanel from './components/DeptTreePanel'
import UserDrawer from './components/UserDrawer'
import UserImportModal from './components/UserImportModal'
import styles from './index.module.less'

const { RangePicker } = DatePicker

const PASSWORD_PATTERN = /^[^<>"'|\\]+$/

export default function UserPage() {
  const page = useUserPage()
  const { sys_normal_disable, sys_user_sex } = useDict('sys_normal_disable', 'sys_user_sex')

  // ---- 重置密码弹窗 ----
  const [resetPwdOpen, setResetPwdOpen] = useState(false)
  const [resetPwdUser, setResetPwdUser] = useState<UserVO | null>(null)
  const [resetPwdValue, setResetPwdValue] = useState('')
  const [resetPwdLoading, setResetPwdLoading] = useState(false)

  const handleResetPwdClick = (row: UserVO) => {
    setResetPwdUser(row)
    setResetPwdValue('')
    setResetPwdOpen(true)
  }

  const handleResetPwdConfirm = async () => {
    if (!resetPwdUser) return
    if (resetPwdValue.length < 5 || resetPwdValue.length > 20) {
      message.warning('密码长度必须在 5 到 20 个字符之间')
      return
    }
    if (!PASSWORD_PATTERN.test(resetPwdValue)) {
      message.warning('密码不能包含 < > " \' \\ | 等特殊字符')
      return
    }
    setResetPwdLoading(true)
    try {
      await page.doResetPwd(resetPwdUser.userId, resetPwdValue)
      setResetPwdOpen(false)
      setResetPwdUser(null)
    } finally {
      setResetPwdLoading(false)
    }
  }

  // ---- 查询区域 ----
  const queryNode = (
    <Form form={page.form} layout="inline">
      <Form.Item name="userName">
        <Input
          placeholder="用户名称"
          allowClear
        />
      </Form.Item>
      <Form.Item name="nickName">
        <Input
          placeholder="用户昵称"
          allowClear
        />
      </Form.Item>
      <Form.Item name="phonenumber">
        <Input
          placeholder="手机号码"
          allowClear
        />
      </Form.Item>
      <Form.Item name="status">
        <DictSelect
          options={sys_normal_disable}
          placeholder="用户状态"
          allowClear
          style={{ width: 160 }}
        />
      </Form.Item>
      <Form.Item name="dateRange">
        <RangePicker />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={() => page.handleSearch()}>搜索</Button>
          <Button onClick={() => page.handleReset()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )

  // ---- 工具栏左侧按钮 ----
  const moreMenuItems = [
    {
      key: 'import',
      label: (
        <Auth permission="system:user:import">
          <span>
            <ImportOutlined /> 导入数据
          </span>
        </Auth>
      ),
      onClick: page.handleImport,
    },
    {
      key: 'export',
      label: (
        <Auth permission="system:user:export">
          <span>
            <DownloadOutlined /> 导出数据
          </span>
        </Auth>
      ),
      onClick: page.handleExport,
    },
    {
      key: 'template',
      label: (
        <span>
          <DownloadOutlined /> 下载模板
        </span>
      ),
      onClick: page.handleDownloadTemplate,
    },
  ]

  const toolbarLeft = (
    <>
      <AuthButton type="primary" icon={<PlusOutlined />} permission="system:user:add" onClick={page.handleAdd}>
        新增
      </AuthButton>
      <AuthButton
        icon={<EditOutlined />}
        permission="system:user:edit"
        disabled={page.single}
        onClick={() => page.handleUpdate()}
      >
        修改
      </AuthButton>
      <AuthButton
        danger
        icon={<DeleteOutlined />}
        permission="system:user:remove"
        disabled={page.multiple}
        onClick={() => page.handleDelete(page.selectedRowKeys)}
      >
        删除
      </AuthButton>
      <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
        <Button>
          <FormOutlined /> 更多
        </Button>
      </Dropdown>
    </>
  )

  // ---- 表格列 ----
  const columns: ColumnsType<UserVO> = [
    { title: '用户编号', dataIndex: 'userId', key: 'userId', width: 100, ellipsis: true },
    { title: '用户名称', dataIndex: 'userName', key: 'userName', ellipsis: true },
    { title: '用户昵称', dataIndex: 'nickName', key: 'nickName', ellipsis: true },
    { title: '部门', dataIndex: 'deptName', key: 'deptName', ellipsis: true },
    { title: '手机号码', dataIndex: 'phonenumber', key: 'phonenumber', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Switch
          checked={record.status === '0'}
          checkedChildren="正常"
          unCheckedChildren="停用"
          onChange={() => page.handleStatusChange(record)}
        />
      ),
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => {
        // userId === 1 的用户不显示操作按钮
        if (record.userId === 1) return null
        return (
          <Space size="small">
            <AuthButton type="link" size="small" permission="system:user:edit" onClick={() => page.handleUpdate(record)}>
              修改
            </AuthButton>
            <AuthButton type="link" size="small" danger permission="system:user:remove" onClick={() => page.handleDelete(record.userId)}>
              删除
            </AuthButton>
            <AuthButton type="link" size="small" permission="system:user:resetPwd" onClick={() => handleResetPwdClick(record)}>
              重置密码
            </AuthButton>
          </Space>
        )
      },
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.deptPanel}>
        <DeptTreePanel
          data={page.enabledDeptOptions}
          selectedDeptId={page.selectedDeptId}
          loading={page.deptLoading}
          onSelectDept={page.handleSelectDept}
        />
      </div>

      <div className={styles.content}>
        <BaseListPage<UserVO>
          rowKey="userId"
          columns={columns}
          dataSource={page.dataList}
          loading={page.loading}
          pagination={{
            current: page.pageNum,
            pageSize: page.pageSize,
            total: page.total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: page.changePage,
          }}
          rowSelection={{
            selectedRowKeys: page.selectedRowKeys,
            onChange: (keys) => page.setSelectedRowKeys(keys as Array<number | string>),
          }}
          queryNode={queryNode}
          toolbarLeft={toolbarLeft}
          onRefresh={page.handleRefresh}
          storageKey="system-user-columns"
        />
      </div>

      <UserDrawer
        open={page.drawerOpen}
        userId={page.editUserId}
        deptTree={page.deptOptions}
        sexOptions={sys_user_sex}
        statusOptions={sys_normal_disable}
        currentUserId={page.currentUserId}
        initPassword={page.initPassword}
        onClose={page.handleDrawerClose}
        onSuccess={() => {
          page.handleDrawerClose()
          page.handleRefresh()
        }}
      />

      <UserImportModal
        open={page.importOpen}
        onClose={() => page.setImportOpen(false)}
        onSuccess={page.handleImportSuccess}
        onDownloadTemplate={page.handleDownloadTemplate}
      />

      <Modal
        title="重置密码"
        open={resetPwdOpen}
        onCancel={() => setResetPwdOpen(false)}
        onOk={handleResetPwdConfirm}
        confirmLoading={resetPwdLoading}
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label={`请输入"${resetPwdUser?.userName ?? ''}"的新密码`}>
            <Input.Password
              placeholder="请输入新密码"
              value={resetPwdValue}
              onChange={(e) => setResetPwdValue(e.target.value)}
              maxLength={20}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
