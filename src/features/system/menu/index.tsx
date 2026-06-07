import { useCallback, useRef, useState } from 'react'
import { Button, Form, Input, message, Modal, Space, Tree } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import BaseListPage from '@/components/BaseListPage'
import AuthButton from '@/components/AuthButton'
import DictSelect from '@/components/DictSelect'
import DictTag from '@/components/DictTag'
import SvgIcon from '@/components/SvgIcon'
import { useDict } from '@/hooks/useDict'
import { cascadeDelMenu, delMenu, listMenu } from '@/api/system/menu'
import type { MenuVO } from '@/api/system/menu/types'
import MenuDrawer from './components/MenuDrawer'

type MenuSearchForm = {
  menuName?: string
  status?: string
}

export default function MenuPage() {
  const { sys_normal_disable } = useDict('sys_normal_disable')

  const [form] = Form.useForm<MenuSearchForm>()
  const [loading, setLoading] = useState(false)
  const [menuList, setMenuList] = useState<MenuVO[]>([])
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editMenuId, setEditMenuId] = useState<number | string | undefined>()
  const [addParentId, setAddParentId] = useState<number | string | undefined>()

  // Cascade delete state
  const [cascadeOpen, setCascadeOpen] = useState(false)
  const [cascadeCheckedKeys, setCascadeCheckedKeys] = useState<React.Key[]>([])
  const [cascadeLoading, setCascadeLoading] = useState(false)

  const fetchList = useCallback(async (params?: MenuSearchForm) => {
    setLoading(true)
    try {
      const query = params ?? form.getFieldsValue()
      const res = await listMenu(query)
      setMenuList(res.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [form])

  const initializedRef = useRef<boolean | null>(null)
  if (initializedRef.current == null) {
    initializedRef.current = true
    void fetchList()
  }

  const handleSearch = () => {
    void fetchList()
  }

  const handleReset = () => {
    form.resetFields()
    void fetchList()
  }

  const handleRefresh = () => {
    void fetchList()
  }

  const handleAdd = (row?: MenuVO) => {
    setEditMenuId(undefined)
    setAddParentId(row?.menuId ?? 0)
    setDrawerOpen(true)
  }

  const handleEdit = (row: MenuVO) => {
    setEditMenuId(row.menuId)
    setAddParentId(undefined)
    setDrawerOpen(true)
  }

  const handleDelete = (row: MenuVO) => {
    Modal.confirm({
      title: '系统提示',
      content: `是否确认删除名称为"${row.menuName}"的数据项?`,
      onOk: async () => {
        await delMenu(row.menuId)
        message.success('删除成功')
        void fetchList()
      },
    })
  }

  const handleCascadeDelete = () => {
    setCascadeCheckedKeys([])
    setCascadeOpen(true)
  }

  const handleCascadeConfirm = async () => {
    if (cascadeCheckedKeys.length === 0) {
      message.warning('请选择要删除的菜单')
      return
    }
    setCascadeLoading(true)
    try {
      await cascadeDelMenu(cascadeCheckedKeys as Array<number | string>)
      message.success('删除成功')
      setCascadeOpen(false)
      void fetchList()
    } finally {
      setCascadeLoading(false)
    }
  }

  const cascadeTreeData = useMemo(() => {
    const convert = (menus: MenuVO[]): { key: React.Key; title: string; children?: ReturnType<typeof convert> }[] =>
      menus.map((menu) => ({
        key: menu.menuId,
        title: menu.menuName,
        children: menu.children ? convert(menu.children) : undefined,
      }))
    return convert(menuList)
  }, [menuList])

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditMenuId(undefined)
    setAddParentId(undefined)
  }

  const handleDrawerSuccess = () => {
    setDrawerOpen(false)
    setEditMenuId(undefined)
    setAddParentId(undefined)
    void fetchList()
  }

  const columns: ColumnsType<MenuVO> = [
    {
      title: '菜单名称',
      dataIndex: 'menuName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 80,
      align: 'center',
      render: (icon: string) => (icon ? <SvgIcon name={icon} size={18} /> : null),
    },
    {
      title: '排序',
      dataIndex: 'orderNum',
      width: 80,
      align: 'center',
    },
    {
      title: '权限标识',
      dataIndex: 'perms',
      ellipsis: true,
    },
    {
      title: '组件路径',
      dataIndex: 'component',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      align: 'center',
      render: (status: string) => (
        <DictTag options={sys_normal_disable} value={status} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: unknown, record: MenuVO) => (
        <Space size="small">
          <AuthButton type="link" size="small" permission="system:menu:edit" onClick={() => handleEdit(record)}>
            <EditOutlined /> 修改
          </AuthButton>
          <AuthButton type="link" size="small" permission="system:menu:add" onClick={() => handleAdd(record)}>
            <PlusOutlined /> 新增
          </AuthButton>
          <AuthButton type="link" size="small" permission="system:menu:remove" danger onClick={() => handleDelete(record)}>
            <DeleteOutlined /> 删除
          </AuthButton>
        </Space>
      ),
    },
  ]

  const queryNode = (
    <Form form={form} layout="inline">
      <Form.Item name="menuName">
        <Input placeholder="菜单名称" allowClear />
      </Form.Item>
      <Form.Item name="status">
        <DictSelect options={sys_normal_disable} placeholder="菜单状态" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )

  const toolbarLeft = (
    <>
      <AuthButton type="primary" icon={<PlusOutlined />} permission="system:menu:add" onClick={() => handleAdd()}>
        新增
      </AuthButton>
      <AuthButton type="primary" danger permission="system:menu:remove" onClick={handleCascadeDelete}>
        级联删除
      </AuthButton>
    </>
  )

  return (
    <>
      <BaseListPage<MenuVO>
        rowKey="menuId"
        columns={columns}
        dataSource={menuList}
        loading={loading}
        pagination={false}
        queryNode={queryNode}
        toolbarLeft={toolbarLeft}
        onRefresh={handleRefresh}
        storageKey="system-menu-columns"
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as React.Key[]),
        }}
      />

      <MenuDrawer
        open={drawerOpen}
        menuId={editMenuId}
        parentId={addParentId}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />

      <Modal
        title="级联删除菜单"
        open={cascadeOpen}
        width={600}
        confirmLoading={cascadeLoading}
        onCancel={() => setCascadeOpen(false)}
        onOk={handleCascadeConfirm}
        destroyOnHidden
      >
        <Tree
          checkable
          treeData={cascadeTreeData}
          checkedKeys={cascadeCheckedKeys}
          onCheck={(checked) => setCascadeCheckedKeys(checked as React.Key[])}
          defaultExpandAll
          style={{ maxHeight: 400, overflow: 'auto' }}
        />
      </Modal>
    </>
  )
}
