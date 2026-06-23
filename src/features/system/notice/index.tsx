import { useCallback, useState } from 'react'
import { Button, Form, Input, message, Modal, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import BaseListPage from '@/components/BaseListPage'
import AuthButton from '@/components/AuthButton'
import DictSelect from '@/components/DictSelect'
import DictTag from '@/components/DictTag'
import { useDict } from '@/hooks/useDict'
import { useTableList } from '@/hooks/useTableList'
import { delNotice, listNotice } from '@/api/system/notice'
import type { NoticeVO } from '@/api/system/notice/types'
import NoticeDrawer from './components/NoticeDrawer'
import styles from './index.module.less'

type NoticeSearchForm = {
  noticeTitle?: string
  createByName?: string
  noticeType?: string
}

export default function NoticePage() {
  const { sys_notice_type, sys_notice_status } = useDict('sys_notice_type', 'sys_notice_status')

  const [form] = Form.useForm<NoticeSearchForm>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editNoticeId, setEditNoticeId] = useState<number | string | undefined>()

  const buildQueryParams = useCallback(
    (formValues: NoticeSearchForm) => ({
      noticeTitle: formValues.noticeTitle ?? '',
      createByName: formValues.createByName ?? '',
      noticeType: formValues.noticeType ?? '',
    }),
    [],
  )

  const {
    dataList,
    total,
    loading,
    pageNum,
    pageSize,
    search,
    reset,
    refresh,
    changePage,
  } = useTableList<NoticeVO, NoticeSearchForm, ReturnType<typeof buildQueryParams>>({
    form,
    request: listNotice,
    buildParams: buildQueryParams,
  })

  const handleDelete = (row?: NoticeVO) => {
    const noticeIds = row?.noticeId ?? selectedRowKeys
    if (!noticeIds || (Array.isArray(noticeIds) && noticeIds.length === 0)) {
      void message.warning('请选择要删除的数据')
      return
    }
    Modal.confirm({
      title: '系统提示',
      content: `是否确认删除公告编号为"${Array.isArray(noticeIds) ? noticeIds.join(',') : noticeIds}"的数据项？`,
      onOk: async () => {
        await delNotice(noticeIds)
        message.success('删除成功')
        refresh()
      },
    })
  }

  const handleAdd = () => {
    setEditNoticeId(undefined)
    setDrawerOpen(true)
  }

  const handleEdit = (row: NoticeVO) => {
    setEditNoticeId(row.noticeId)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditNoticeId(undefined)
  }

  const handleDrawerSuccess = () => {
    setDrawerOpen(false)
    setEditNoticeId(undefined)
    refresh()
  }

  const single = selectedRowKeys.length !== 1
  const multiple = selectedRowKeys.length === 0

  const columns: ColumnsType<NoticeVO> = [
    { title: '序号', dataIndex: 'noticeId', width: 80, align: 'center', hidden: true },
    { title: '公告标题', dataIndex: 'noticeTitle', ellipsis: true },
    {
      title: '公告类型',
      dataIndex: 'noticeType',
      width: 100,
      align: 'center',
      render: (value: string) => (
        <DictTag options={sys_notice_type} value={value} />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (value: string) => (
        <DictTag options={sys_notice_status} value={value} />
      ),
    },
    { title: '创建者', dataIndex: 'createByName', width: 100, align: 'center' },
    { title: '创建时间', dataIndex: 'createTime', width: 160, align: 'center' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: unknown, record: NoticeVO) => (
        <Space size="small">
          <AuthButton type="link" size="small" permission="system:notice:edit" onClick={() => handleEdit(record)}>
            <EditOutlined /> 修改
          </AuthButton>
          <AuthButton type="link" size="small" permission="system:notice:remove" danger onClick={() => handleDelete(record)}>
            <DeleteOutlined /> 删除
          </AuthButton>
        </Space>
      ),
    },
  ]

  const queryNode = (
    <Form form={form} layout="inline">
      <Form.Item name="noticeTitle">
        <Input placeholder="公告标题" allowClear />
      </Form.Item>
      <Form.Item name="createByName">
        <Input placeholder="操作人员" allowClear />
      </Form.Item>
      <Form.Item name="noticeType">
        <DictSelect options={sys_notice_type} placeholder="公告类型" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={() => search()}>搜索</Button>
          <Button onClick={() => reset()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )

  const toolbarLeft = (
    <>
      <AuthButton type="primary" icon={<PlusOutlined />} permission="system:notice:add" onClick={handleAdd}>
        新增
      </AuthButton>
      <AuthButton icon={<EditOutlined />} permission="system:notice:edit" disabled={single} onClick={() => {
        const row = dataList.find((r) => r.noticeId === selectedRowKeys[0])
        if (row) handleEdit(row)
      }}>
        修改
      </AuthButton>
      <AuthButton danger icon={<DeleteOutlined />} permission="system:notice:remove" disabled={multiple} onClick={() => handleDelete()}>
        删除
      </AuthButton>
    </>
  )

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <BaseListPage<NoticeVO>
          rowKey="noticeId"
          columns={columns}
          dataSource={dataList}
          loading={loading}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: changePage,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as Array<number | string>),
          }}
          queryNode={queryNode}
          toolbarLeft={toolbarLeft}
          onRefresh={refresh}
          storageKey="system-notice-columns"
        />
      </div>

      <NoticeDrawer
        open={drawerOpen}
        noticeId={editNoticeId}
        noticeTypeOptions={sys_notice_type}
        noticeStatusOptions={sys_notice_status}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  )
}
