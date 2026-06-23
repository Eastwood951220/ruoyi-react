import { useCallback, useEffect, useState } from 'react'
import { Button, Form, Input, message, Modal, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import BaseListPage from '@/components/BaseListPage'
import AuthButton from '@/components/AuthButton'
import DictSelect from '@/components/DictSelect'
import DictTag from '@/components/DictTag'
import { useDict } from '@/hooks/useDict'
import { useTableList } from '@/hooks/useTableList'
import { deptTreeSelect } from '@/api/system/dept'
import { delPost, exportPost, listPost } from '@/api/system/post'
import type { PostVO } from '@/api/system/post/types'
import type { DeptTreeNode } from '@/api/system/dept/types'
import DeptTreePanel from '@/components/DeptTreePanel'
import PostDrawer from './components/PostDrawer'
import styles from './index.module.less'

type PostSearchForm = {
  postCode?: string
  postCategory?: string
  postName?: string
  deptId?: number | string
  status?: string
}

export default function PostPage() {
  const { sys_normal_disable } = useDict('sys_normal_disable')

  const [form] = Form.useForm<PostSearchForm>()
  const [deptTree, setDeptTree] = useState<DeptTreeNode[]>([])
  const [deptLoading, setDeptLoading] = useState(false)
  const [selectedDeptId, setSelectedDeptId] = useState<number | string | undefined>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editPostId, setEditPostId] = useState<number | string | undefined>()

  // Load dept tree
  const fetchDeptTree = useCallback(async () => {
    setDeptLoading(true)
    try {
      const res = await deptTreeSelect()
      setDeptTree(res.data ?? [])
    } finally {
      setDeptLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchDeptTree()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchDeptTree])

  const buildQueryParams = useCallback(
    (formValues: PostSearchForm) => ({
      postCode: formValues.postCode ?? '',
      postCategory: formValues.postCategory ?? '',
      postName: formValues.postName ?? '',
      deptId: formValues.deptId ?? '',
      belongDeptId: selectedDeptId ?? '',
      status: formValues.status ?? '',
    }),
    [selectedDeptId],
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
  } = useTableList<PostVO, PostSearchForm, ReturnType<typeof buildQueryParams>>({
    form,
    request: listPost,
    buildParams: buildQueryParams,
  })

  const handleSelectDept = useCallback(
    (deptId: number | string | undefined) => {
      setSelectedDeptId(deptId)
      form.setFieldValue('deptId', undefined)
      search({ belongDeptId: deptId ?? '', deptId: '' })
    },
    [form, search],
  )

  const handleDelete = (row?: PostVO) => {
    const postIds = row?.postId ?? selectedRowKeys
    if (!postIds || (Array.isArray(postIds) && postIds.length === 0)) {
      void message.warning('请选择要删除的数据')
      return
    }
    Modal.confirm({
      title: '系统提示',
      content: `是否确认删除岗位编号为"${Array.isArray(postIds) ? postIds.join(',') : postIds}"的数据项？`,
      onOk: async () => {
        await delPost(postIds)
        message.success('删除成功')
        refresh()
      },
    })
  }

  const handleAdd = () => {
    setEditPostId(undefined)
    setDrawerOpen(true)
  }

  const handleEdit = (row: PostVO) => {
    setEditPostId(row.postId)
    setDrawerOpen(true)
  }

  const handleExport = () => {
    const formValues = form.getFieldsValue()
    void exportPost(buildQueryParams(formValues) as Parameters<typeof exportPost>[0])
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditPostId(undefined)
  }

  const handleDrawerSuccess = () => {
    setDrawerOpen(false)
    setEditPostId(undefined)
    refresh()
  }

  const single = selectedRowKeys.length !== 1
  const multiple = selectedRowKeys.length === 0

  const columns: ColumnsType<PostVO> = [
    { title: '岗位编码', dataIndex: 'postCode', ellipsis: true },
    { title: '类别编码', dataIndex: 'postCategory', ellipsis: true },
    { title: '岗位名称', dataIndex: 'postName', ellipsis: true },
    { title: '部门', dataIndex: 'deptName', ellipsis: true },
    { title: '排序', dataIndex: 'postSort', width: 80, align: 'center' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      align: 'center',
      render: (status: string) => (
        <DictTag options={sys_normal_disable} value={status} />
      ),
    },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: PostVO) => (
        <Space size="small">
          <AuthButton type="link" size="small" permission="system:post:edit" onClick={() => handleEdit(record)}>
            <EditOutlined /> 修改
          </AuthButton>
          <AuthButton type="link" size="small" permission="system:post:remove" danger onClick={() => handleDelete(record)}>
            <DeleteOutlined /> 删除
          </AuthButton>
        </Space>
      ),
    },
  ]

  const queryNode = (
    <Form form={form} layout="inline">
      <Form.Item name="postCode">
        <Input placeholder="岗位编码" allowClear />
      </Form.Item>
      <Form.Item name="postCategory">
        <Input placeholder="类别编码" allowClear />
      </Form.Item>
      <Form.Item name="postName">
        <Input placeholder="岗位名称" allowClear />
      </Form.Item>
      <Form.Item name="status">
        <DictSelect options={sys_normal_disable} placeholder="岗位状态" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={() => search()}>搜索</Button>
          <Button onClick={() => { setSelectedDeptId(undefined); reset({ belongDeptId: '' }) }}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )

  const toolbarLeft = (
    <>
      <AuthButton type="primary" icon={<PlusOutlined />} permission="system:post:add" onClick={handleAdd}>
        新增
      </AuthButton>
      <AuthButton icon={<EditOutlined />} permission="system:post:edit" disabled={single} onClick={() => {
        const row = dataList.find((r) => r.postId === selectedRowKeys[0])
        if (row) handleEdit(row)
      }}>
        修改
      </AuthButton>
      <AuthButton danger icon={<DeleteOutlined />} permission="system:post:remove" disabled={multiple} onClick={() => handleDelete()}>
        删除
      </AuthButton>
      <AuthButton icon={<DownloadOutlined />} permission="system:post:export" onClick={handleExport}>
        导出
      </AuthButton>
    </>
  )

  return (
    <div className={styles.page}>
      <div className={styles.deptPanel}>
        <DeptTreePanel
          data={deptTree}
          selectedDeptId={selectedDeptId}
          loading={deptLoading}
          onSelectDept={handleSelectDept}
        />
      </div>

      <div className={styles.content}>
        <BaseListPage<PostVO>
          rowKey="postId"
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
          storageKey="system-post-columns"
        />
      </div>

      <PostDrawer
        open={drawerOpen}
        postId={editPostId}
        deptTree={deptTree}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  )
}
