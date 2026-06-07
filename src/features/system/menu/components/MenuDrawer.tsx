import { useCallback, useRef, useState } from 'react'
import { Col, Form, Input, InputNumber, message, Radio, Row, TreeSelect } from 'antd'
import BaseDrawer from '@/components/BaseDrawer'
import IconSelect from '@/components/IconSelect'
import { addMenu, getMenu, listMenu, updateMenu } from '@/api/system/menu'
import type { MenuForm, MenuTreeOption, MenuVO } from '@/api/system/menu/types'

interface MenuDrawerProps {
  open: boolean
  menuId?: number | string
  parentId?: number | string
  onClose: () => void
  onSuccess: () => void
}

function buildMenuTreeOptions(menus: MenuVO[]): MenuTreeOption[] {
  return menus.map((menu) => ({
    id: menu.menuId,
    label: menu.menuName,
    disabled: false,
    children: menu.children ? buildMenuTreeOptions(menu.children) : undefined,
  }))
}

export default function MenuDrawer(props: MenuDrawerProps) {
  const { open, menuId, parentId, onClose, onSuccess } = props

  const [form] = Form.useForm<MenuForm>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [menuOptions, setMenuOptions] = useState<MenuTreeOption[]>([])
  const fetchedRef = useRef(false)

  const isEdit = menuId !== undefined
  const menuType = Form.useWatch('menuType', form) ?? 'M'

  const fetchMenuTree = useCallback(async () => {
    const res = await listMenu()
    const data = res.data ?? []
    const tree = buildMenuTreeOptions(data)
    setMenuOptions([{ id: 0, label: '主类目', children: tree }])
  }, [])

  const handleAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return
      if (fetchedRef.current) return
      fetchedRef.current = true

      setLoading(true)
      Promise.all([
        fetchMenuTree(),
        isEdit && menuId !== undefined ? getMenu(menuId) : Promise.resolve(null),
      ])
        .then(([, menuRes]) => {
          if (isEdit && menuRes?.data) {
            const data = menuRes.data
            form.setFieldsValue({
              menuId: data.menuId,
              parentId: data.parentId,
              menuName: data.menuName,
              orderNum: data.orderNum,
              path: data.path,
              component: data.component ?? '',
              queryParam: data.queryParam ?? '',
              isFrame: data.isFrame ?? '1',
              isCache: data.isCache ?? '0',
              menuType: data.menuType ?? 'M',
              visible: data.visible ?? '0',
              status: data.status ?? '0',
              icon: data.icon ?? '',
              remark: data.remark ?? '',
              perms: data.perms ?? '',
            })
          } else {
            form.setFieldsValue({
              parentId: parentId ?? 0,
              menuType: 'M',
              orderNum: 1,
              isFrame: '1',
              isCache: '0',
              visible: '0',
              status: '0',
            })
          }
        })
        .finally(() => setLoading(false))
    },
    [isEdit, menuId, parentId, form, fetchMenuTree],
  )

  const handleClose = () => {
    fetchedRef.current = false
    form.resetFields()
    setMenuOptions([])
    onClose()
  }

  const handleConfirm = async () => {
    if (loading) return
    const values = await form.validateFields()
    setSubmitting(true)

    try {
      if (isEdit) {
        await updateMenu({ ...values, menuId })
        message.success('修改成功')
      } else {
        await addMenu(values)
        message.success('新增成功')
      }
      form.resetFields()
      fetchedRef.current = false
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const rules = {
    menuName: [{ required: true, message: '菜单名称不能为空' }],
    orderNum: [{ required: true, message: '菜单顺序不能为空' }],
    path: [{ required: true, message: '路由地址不能为空' }],
  }

  return (
    <BaseDrawer
      open={open}
      title={isEdit ? '修改菜单' : '添加菜单'}
      width={700}
      loading={loading}
      confirmLoading={submitting}
      onClose={handleClose}
      onConfirm={handleConfirm}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="parentId" label="上级菜单">
              <TreeSelect
                treeData={menuOptions}
                fieldNames={{ value: 'id', label: 'label', children: 'children' }}
                placeholder="选择上级菜单"
                treeDefaultExpandAll
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="menuType" label="菜单类型">
              <Radio.Group>
                <Radio value="M">目录</Radio>
                <Radio value="C">菜单</Radio>
                <Radio value="F">按钮</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          {menuType !== 'F' && (
            <Col span={24}>
              <Form.Item name="icon" label="菜单图标">
                <IconSelect />
              </Form.Item>
            </Col>
          )}
          <Col span={12}>
            <Form.Item name="menuName" label="菜单名称" rules={rules.menuName}>
              <Input placeholder="请输入菜单名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="orderNum" label="显示排序" rules={rules.orderNum}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </Col>
          {menuType !== 'F' && (
            <Col span={12}>
              <Form.Item
                name="path"
                label="路由地址"
                rules={rules.path}
                tooltip="访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头"
              >
                <Input placeholder="请输入路由地址" />
              </Form.Item>
            </Col>
          )}
          {menuType === 'C' && (
            <Col span={12}>
              <Form.Item
                name="component"
                label="组件路径"
                tooltip="访问的组件路径，如：`system/user/index`，默认在`features`目录下"
              >
                <Input placeholder="请输入组件路径" />
              </Form.Item>
            </Col>
          )}
          {menuType !== 'M' && (
            <Col span={12}>
              <Form.Item
                name="perms"
                label="权限字符"
                tooltip="控制器中定义的权限字符，如：@SaCheckPermission('system:user:list')"
              >
                <Input placeholder="请输入权限字符" />
              </Form.Item>
            </Col>
          )}
          {menuType === 'C' && (
            <Col span={12}>
              <Form.Item
                name="queryParam"
                label="路由参数"
                tooltip='访问路由的默认传递参数，如：`{"id": 1, "name": "ry"}`'
              >
                <Input placeholder="请输入路由参数" />
              </Form.Item>
            </Col>
          )}
          {menuType !== 'F' && (
            <Col span={12}>
              <Form.Item name="isFrame" label="是否外链" tooltip="选择是外链则路由地址需要以`http(s)://`开头">
                <Radio.Group>
                  <Radio value="0">是</Radio>
                  <Radio value="1">否</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          )}
          {menuType === 'C' && (
            <Col span={12}>
              <Form.Item name="isCache" label="是否缓存" tooltip="选择是则会被keep-alive缓存">
                <Radio.Group>
                  <Radio value="0">缓存</Radio>
                  <Radio value="1">不缓存</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          )}
          {menuType !== 'F' && (
            <Col span={12}>
              <Form.Item name="visible" label="显示状态" tooltip="选择隐藏则路由将不会出现在侧边栏">
                <Radio.Group>
                  <Radio value="0">显示</Radio>
                  <Radio value="1">隐藏</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          )}
          <Col span={12}>
            <Form.Item name="status" label="菜单状态" tooltip="选择停用则路由将不会出现在侧边栏，也不能被访问">
              <Radio.Group>
                <Radio value="0">正常</Radio>
                <Radio value="1">停用</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={3} placeholder="请输入备注" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </BaseDrawer>
  )
}
