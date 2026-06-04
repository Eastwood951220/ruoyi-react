import { useCallback, useRef, useState } from 'react'
import { Checkbox, Col, Form, message, Row, Select, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import BaseDrawer from '@/components/BaseDrawer'
import { getRole, dataScope, deptTreeSelect } from '@/api/system/role'
import type { RoleForm, DeptTreeOption } from '@/api/system/role/types'

interface DataScopeDrawerProps {
  open: boolean
  roleId?: number | string
  onClose: () => void
  onSuccess: () => void
}

const DATA_SCOPE_OPTIONS = [
  { value: '1', label: '全部数据权限' },
  { value: '2', label: '自定数据权限' },
  { value: '3', label: '本部门数据权限' },
  { value: '4', label: '本部门及以下数据权限' },
  { value: '5', label: '仅本人数据权限' },
  { value: '6', label: '部门及以下或本人数据权限' },
]

function convertDeptTree(nodes: DeptTreeOption[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.label,
    disabled: node.disabled,
    children: node.children ? convertDeptTree(node.children) : undefined,
  }))
}

export default function DataScopeDrawer(props: DataScopeDrawerProps) {
  const { open, roleId, onClose, onSuccess } = props

  const [form] = Form.useForm<RoleForm>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deptTreeData, setDeptTreeData] = useState<DataNode[]>([])
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([])
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<React.Key[]>([])
  const [deptCheckStrictly, setDeptCheckStrictly] = useState(true)
  const [currentDataScope, setCurrentDataScope] = useState('1')
  const fetchedRef = useRef(false)

  const handleAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return
      if (fetchedRef.current) return
      fetchedRef.current = true

      if (roleId !== undefined) {
        setLoading(true)
        Promise.all([getRole(roleId), deptTreeSelect(roleId)])
          .then(([roleRes, deptRes]) => {
            const roleData = roleRes.data
            if (roleData) {
              form.setFieldsValue({
                roleId: roleData.roleId,
                dataScope: roleData.dataScope ?? '1',
                deptCheckStrictly: roleData.deptCheckStrictly ?? true,
              })
              setCurrentDataScope(roleData.dataScope ?? '1')
              setDeptCheckStrictly(roleData.deptCheckStrictly ?? true)
            }
            const depts = deptRes.depts ?? []
            const checked = deptRes.checkedKeys ?? []
            setDeptTreeData(convertDeptTree(depts))
            setCheckedKeys(checked)
          })
          .finally(() => setLoading(false))
      }
    },
    [roleId, form],
  )

  const handleClose = () => {
    fetchedRef.current = false
    form.resetFields()
    setDeptTreeData([])
    setCheckedKeys([])
    setHalfCheckedKeys([])
    setCurrentDataScope('1')
    onClose()
  }

  const handleConfirm = async () => {
    const values = await form.validateFields()
    setSubmitting(true)

    try {
      const allDeptIds = currentDataScope === '2'
        ? ([...checkedKeys, ...halfCheckedKeys] as Array<number | string>)
        : []
      const submitData: RoleForm = {
        roleId,
        dataScope: values.dataScope,
        deptCheckStrictly,
        deptIds: allDeptIds,
      }
      await dataScope(submitData)
      message.success('修改成功')
      form.resetFields()
      fetchedRef.current = false
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const onCheck = (
    checked: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
    info: { halfCheckedKeys?: React.Key[] },
  ) => {
    if (Array.isArray(checked)) {
      setCheckedKeys(checked)
      setHalfCheckedKeys(info.halfCheckedKeys ?? [])
    } else {
      setCheckedKeys(checked.checked)
      setHalfCheckedKeys(checked.halfChecked)
    }
  }

  return (
    <BaseDrawer
      open={open}
      title="分配数据权限"
      width={500}
      loading={loading}
      confirmLoading={submitting}
      onClose={handleClose}
      onConfirm={handleConfirm}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="dataScope" label="权限范围">
              <Select
                options={DATA_SCOPE_OPTIONS}
                onChange={(val) => setCurrentDataScope(val)}
              />
            </Form.Item>
          </Col>
          {currentDataScope === '2' && (
            <Col span={24}>
              <Form.Item label="数据权限">
                <div style={{ marginBottom: 8 }}>
                  <Checkbox
                    checked={deptCheckStrictly}
                    onChange={(e) => setDeptCheckStrictly(e.target.checked)}
                  >
                    父子联动
                  </Checkbox>
                </div>
                <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 8, maxHeight: 300, overflow: 'auto' }}>
                  <Tree
                    checkable
                    checkStrictly={!deptCheckStrictly}
                    treeData={deptTreeData}
                    checkedKeys={checkedKeys}
                    onCheck={onCheck}
                    defaultExpandAll
                  />
                </div>
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </BaseDrawer>
  )
}
