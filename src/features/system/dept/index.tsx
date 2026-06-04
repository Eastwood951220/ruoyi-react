import { useCallback, useState, type Key } from 'react'
import { Button, Form, Input, message, Modal, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined } from '@ant-design/icons'
import AuthButton from '@/components/AuthButton'
import BaseListPage from '@/components/BaseListPage'
import DictSelect from '@/components/DictSelect'
import DictTag from '@/components/DictTag'
import { useDict } from '@/hooks/useDict'
import { useTableList } from '@/hooks/useTableList'
import { listDept, delDept } from '@/api/system/dept'
import type { DeptQuery, DeptVO } from '@/api/system/dept/types'
import DeptDrawer from './components/DeptDrawer'
import styles from './index.module.less'

function buildDeptTree(list: DeptVO[], parentId: number | string = 0): DeptVO[] {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildDeptTree(list, item.deptId),
    }))
}

function collectDeptIds(nodes: DeptVO[]): Array<number | string> {
  const ids: Array<number | string> = []
  for (const node of nodes) {
    ids.push(node.deptId)
    if (node.children?.length) {
      ids.push(...collectDeptIds(node.children))
    }
  }
  return ids
}

export default function DeptPage() {
  const { sys_normal_disable } = useDict('sys_normal_disable')

  const [form] = Form.useForm<DeptQuery>()
  const [expandedRowKeys, setExpandedRowKeys] = useState<Key[]>([])
  const [isExpandAll, setIsExpandAll] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editDeptId, setEditDeptId] = useState<number | string | undefined>()
  const [addParentId, setAddParentId] = useState<number | string | undefined>()

  const buildQueryParams = useCallback((formValues: DeptQuery): DeptQuery => ({
      deptName: formValues.deptName ?? '',
      deptCategory: formValues.deptCategory ?? '',
      status: formValues.status ?? '',
  }), [])

  const {
    dataList,
    loading,
    search: handleSearch,
    reset: handleReset,
    refresh,
  } = useTableList<DeptVO, DeptQuery, DeptQuery>({
    form,
    request: listDept,
    buildParams: buildQueryParams,
    transformRows: (rows) => buildDeptTree(rows),
    onSuccess: (tree) => {
      if (isExpandAll) {
        setExpandedRowKeys(collectDeptIds(tree))
      }
    },
  })

  const handleToggleExpandAll = () => {
    if (isExpandAll) {
      setExpandedRowKeys([])
    } else {
      setExpandedRowKeys(collectDeptIds(dataList))
    }
    setIsExpandAll(!isExpandAll)
  }

  const handleAdd = (row?: DeptVO) => {
    setEditDeptId(undefined)
    setAddParentId(row?.deptId)
    setDrawerOpen(true)
  }

  const handleEdit = (row: DeptVO) => {
    setEditDeptId(row.deptId)
    setAddParentId(undefined)
    setDrawerOpen(true)
  }

  const handleDelete = (row: DeptVO) => {
    Modal.confirm({
      title: '系统提示',
      content: `是否确认删除名称为"${row.deptName}"的数据项？`,
      onOk: async () => {
        await delDept(row.deptId)
        message.success('删除成功')
        refresh()
      },
    })
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditDeptId(undefined)
    setAddParentId(undefined)
  }

  const handleDrawerSuccess = () => {
    setDrawerOpen(false)
    setEditDeptId(undefined)
    setAddParentId(undefined)
    refresh()
  }

  // ---- 查询区域 ----
  const queryNode = (
    <Form form={form} layout="inline">
      <Form.Item name="deptName">
        <Input placeholder="部门名称" allowClear />
      </Form.Item>
      <Form.Item name="deptCategory">
        <Input placeholder="类别编码" allowClear style={{ width: 240 }} />
      </Form.Item>
      <Form.Item name="status">
        <DictSelect
          options={sys_normal_disable}
          placeholder="状态"
          allowClear
          style={{ width: 160 }}
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={() => handleSearch()}>搜索</Button>
          <Button onClick={() => handleReset()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )

  // ---- 工具栏左侧按钮 ----
  const toolbarLeft = (
    <>
      <AuthButton type="primary" icon={<PlusOutlined />} permission="system:dept:add" onClick={() => handleAdd()}>
        新增
      </AuthButton>
      <Button onClick={handleToggleExpandAll}>
        {isExpandAll ? '折叠' : '展开'}
      </Button>
    </>
  )

  // ---- 表格列 ----
  const columns: ColumnsType<DeptVO> = [
    { title: '部门名称', dataIndex: 'deptName', width: 260 },
    { title: '类别编码', dataIndex: 'deptCategory', width: 200, align: 'center' },
    { title: '排序', dataIndex: 'orderNum', width: 200, align: 'center' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (value: string) => <DictTag options={sys_normal_disable} value={value} />,
    },
    { title: '创建时间', dataIndex: 'createTime', width: 200, align: 'center' },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <AuthButton type="link" size="small" permission="system:dept:edit" onClick={() => handleEdit(record)}>
            修改
          </AuthButton>
          <AuthButton type="link" size="small" permission="system:dept:add" onClick={() => handleAdd(record)}>
            新增
          </AuthButton>
          <AuthButton type="link" size="small" danger permission="system:dept:remove" onClick={() => handleDelete(record)}>
            删除
          </AuthButton>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <BaseListPage<DeptVO>
        rowKey="deptId"
        columns={columns}
        dataSource={dataList}
        loading={loading}
        pagination={false}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as Key[]),
        }}
        queryNode={queryNode}
        toolbarLeft={toolbarLeft}
        onRefresh={refresh}
        storageKey="system-dept-columns"
      />

      <DeptDrawer
        open={drawerOpen}
        deptId={editDeptId}
        parentId={addParentId}
        statusOptions={sys_normal_disable}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  )
}
