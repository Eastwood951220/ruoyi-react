import { useCallback, useRef, useState } from 'react'
import { Checkbox, Col, Form, Input, InputNumber, message, Radio, Row } from 'antd'
import type { DataNode } from 'antd/es/tree'
import BaseDrawer from '@/components/BaseDrawer'
import { getRole, addRole, updateRole, roleMenuTreeselect, menuTreeselect } from '@/api/system/role'
import type { RoleForm, MenuTreeOption } from '@/api/system/role/types'
import type { DictOption } from '@/store/useDictStore'
import VirtualCheckTree from './VirtualCheckTree'

interface RoleDrawerProps {
  open: boolean
  roleId?: number | string
  statusOptions: DictOption[]
  onClose: () => void
  onSuccess: () => void
}

function convertMenuTree(nodes: MenuTreeOption[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.label,
    disabled: node.disabled,
    children: node.children ? convertMenuTree(node.children) : undefined,
  }))
}

export default function RoleDrawer(props: RoleDrawerProps) {
  const { open, roleId, statusOptions, onClose, onSuccess } = props

  const [form] = Form.useForm<RoleForm>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [menuTreeData, setMenuTreeData] = useState<DataNode[]>([])
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([])
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<React.Key[]>([])
  const [menuCheckStrictly, setMenuCheckStrictly] = useState(true)
  const fetchedRef = useRef(false)

  const isEdit = roleId !== undefined

  const handleAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return
      if (fetchedRef.current) return
      fetchedRef.current = true

      if (isEdit && roleId !== undefined) {
        setLoading(true)
        Promise.all([getRole(roleId), roleMenuTreeselect(roleId)])
          .then(([roleRes, menuRes]) => {
            const roleData = roleRes.data
            if (roleData) {
              form.setFieldsValue({
                roleId: roleData.roleId,
                roleName: roleData.roleName,
                roleKey: roleData.roleKey,
                roleSort: Number(roleData.roleSort ?? 0),
                status: roleData.status ?? '0',
                menuCheckStrictly: roleData.menuCheckStrictly ?? true,
                remark: roleData.remark ?? '',
              })
              setMenuCheckStrictly(roleData.menuCheckStrictly ?? true)
            }
            const menus = menuRes.menus ?? []
            const checked = menuRes.checkedKeys ?? []
            setMenuTreeData(convertMenuTree(menus))
            setCheckedKeys(checked)
          })
          .finally(() => setLoading(false))
      } else {
        form.setFieldsValue({ roleSort: 1, status: '0', menuCheckStrictly: true })
        setMenuCheckStrictly(true)
        menuTreeselect().then((res) => {
          setMenuTreeData(convertMenuTree(res.menus ?? []))
          setCheckedKeys([])
        })
      }
    },
    [isEdit, roleId, form],
  )

  const handleClose = () => {
    fetchedRef.current = false
    form.resetFields()
    setMenuTreeData([])
    setCheckedKeys([])
    setHalfCheckedKeys([])
    onClose()
  }

  const handleConfirm = async () => {
    const values = await form.validateFields()
    setSubmitting(true)

    try {
      // 合并选中和半选中的节点
      const allMenuIds = [...checkedKeys, ...halfCheckedKeys] as Array<number | string>
      const submitData: RoleForm = {
        ...values,
        menuIds: allMenuIds,
        menuCheckStrictly,
      }

      if (isEdit) {
        await updateRole({ ...submitData, roleId })
        message.success('修改成功')
      } else {
        await addRole(submitData)
        message.success('新增成功')
      }
      form.resetFields()
      fetchedRef.current = false
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const handleTreeCheck = useCallback((newChecked: React.Key[], newHalf: React.Key[]) => {
    setCheckedKeys(newChecked)
    setHalfCheckedKeys(newHalf)
  }, [])

  const rules = {
    roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
    roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
    roleSort: [{ required: true, message: '角色顺序不能为空', trigger: 'blur' }],
  }

  return (
    <BaseDrawer
      open={open}
      title={isEdit ? '修改角色' : '添加角色'}
      width={600}
      loading={loading}
      confirmLoading={submitting}
      onClose={handleClose}
      onConfirm={handleConfirm}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="roleName" label="角色名称" rules={rules.roleName}>
              <Input placeholder="请输入角色名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="roleKey" label="权限字符" rules={rules.roleKey} tooltip="控制器中定义的权限字符，如：@SaCheckRole('admin')">
              <Input placeholder="请输入权限字符" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="roleSort" label="角色顺序" rules={rules.roleSort}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="状态">
              <Radio.Group>
                {statusOptions.map((opt) => (
                  <Radio key={opt.value} value={opt.value}>
                    {opt.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="菜单权限">
              <div style={{ marginBottom: 8 }}>
                <Checkbox
                  checked={menuCheckStrictly}
                  onChange={(e) => setMenuCheckStrictly(e.target.checked)}
                >
                  父子联动
                </Checkbox>
              </div>
              <VirtualCheckTree
                treeData={menuTreeData}
                checkedKeys={checkedKeys}
                halfCheckedKeys={halfCheckedKeys}
                checkStrictly={!menuCheckStrictly}
                height={300}
                onCheck={handleTreeCheck}
              />
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
