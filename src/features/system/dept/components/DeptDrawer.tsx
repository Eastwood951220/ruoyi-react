import { useCallback, useRef, useState } from 'react'
import { Col, Form, Input, InputNumber, message, Radio, Row, Select, TreeSelect } from 'antd'
import BaseDrawer from '@/components/BaseDrawer'
import { getDept, listDept, listDeptExcludeChild, addDept, updateDept } from '@/api/system/dept'
import type { DeptForm, DeptVO } from '@/api/system/dept/types'
import type { UserVO } from '@/api/system/user/types'
import { listUserByDeptId } from '@/api/system/user'
import type { DictOption } from '@/store/useDictStore'

interface DeptDrawerProps {
  open: boolean
  deptId?: number | string
  parentId?: number | string
  statusOptions: DictOption[]
  onClose: () => void
  onSuccess: () => void
}

function convertToTreeSelectData(nodes: DeptVO[]): Record<string, unknown>[] {
  return nodes.map((node) => ({
    value: node.deptId,
    title: node.deptName,
    disabled: false,
    children: node.children ? convertToTreeSelectData(node.children) : undefined,
  }))
}

function buildDeptTree(list: DeptVO[], parentId: number | string = 0): DeptVO[] {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildDeptTree(list, item.deptId),
    }))
}

export default function DeptDrawer(props: DeptDrawerProps) {
  const { open, deptId, parentId, statusOptions, onClose, onSuccess } = props

  const [form] = Form.useForm<DeptForm>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deptTreeData, setDeptTreeData] = useState<Record<string, unknown>[]>([])
  const [userOptions, setUserOptions] = useState<{ value: number | string; label: string }[]>([])
  const [currentParentId, setCurrentParentId] = useState<number | string | undefined>()
  const fetchedRef = useRef(false)

  const isEdit = deptId !== undefined

  const handleAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return
      if (fetchedRef.current) return
      fetchedRef.current = true

      if (isEdit && deptId !== undefined) {
        setLoading(true)
        Promise.all([
          getDept(deptId),
          listDeptExcludeChild(deptId),
          listUserByDeptId(deptId),
        ])
          .then(([deptRes, treeRes, userRes]) => {
            const data = deptRes.data
            if (data) {
              setCurrentParentId(data.parentId)
              form.setFieldsValue({
                deptId: data.deptId,
                parentId: data.parentId,
                deptName: data.deptName,
                deptCategory: data.deptCategory,
                orderNum: data.orderNum ?? 0,
                leader: data.leader,
                phone: data.phone,
                email: data.email,
                status: data.status ?? '0',
              })

              // 构建上级部门树（排除自身和子节点）
              const treeList = treeRes.data ?? []
              if (treeList.length === 0) {
                // 若排除后为空，至少保留当前父节点
                setDeptTreeData([{ value: data.parentId, title: data.parentName ?? '根节点' }])
              } else {
                const tree = buildDeptTree(treeList)
                setDeptTreeData(convertToTreeSelectData(tree))
              }
            }

            const users = userRes.data ?? []
            setUserOptions(users.map((u: UserVO) => ({ value: u.userId, label: u.userName })))
          })
          .finally(() => setLoading(false))
      } else {
        // 新增：加载部门树 + 设置默认值
        listDept().then((res) => {
          const tree = buildDeptTree(res.data ?? [])
          setDeptTreeData(convertToTreeSelectData(tree))
        })
        form.setFieldsValue({
          parentId: parentId,
          orderNum: 0,
          status: '0',
        })
        setCurrentParentId(parentId)
      }
    },
    [isEdit, deptId, parentId, form],
  )

  const handleClose = () => {
    fetchedRef.current = false
    setUserOptions([])
    setDeptTreeData([])
    setCurrentParentId(undefined)
    form.resetFields()
    onClose()
  }

  const handleConfirm = async () => {
    const values = await form.validateFields()
    setSubmitting(true)

    try {
      if (isEdit) {
        await updateDept({ ...values, deptId })
        message.success('修改成功')
      } else {
        await addDept(values)
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
    parentId: [{ required: true, message: '上级部门不能为空', trigger: 'change' }],
    deptName: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
    email: [{ type: 'email' as const, message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
    phone: [{ pattern: /^1[3456789][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  }

  const showParent = currentParentId !== 0

  return (
    <BaseDrawer
      open={open}
      title={isEdit ? '修改部门' : '添加部门'}
      width={600}
      loading={loading}
      confirmLoading={submitting}
      onClose={handleClose}
      onConfirm={handleConfirm}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Row gutter={16}>
          {showParent && (
            <Col span={24}>
              <Form.Item name="parentId" label="上级部门" rules={rules.parentId}>
                <TreeSelect
                  placeholder="请选择上级部门"
                  treeData={deptTreeData}
                  allowClear
                  treeDefaultExpandAll
                />
              </Form.Item>
            </Col>
          )}
          <Col span={12}>
            <Form.Item name="deptName" label="部门名称" rules={rules.deptName}>
              <Input placeholder="请输入部门名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="deptCategory" label="类别编码">
              <Input placeholder="请输入类别编码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="orderNum" label="显示排序" rules={rules.orderNum}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="leader" label="负责人">
              <Select
                placeholder="请选择负责人"
                allowClear
                showSearch
                option-filter-prop="label"
                options={userOptions}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="联系电话" rules={rules.phone}>
              <Input placeholder="请输入联系电话" maxLength={11} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="邮箱" rules={rules.email}>
              <Input placeholder="请输入邮箱" maxLength={50} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="status" label="部门状态">
              <Radio.Group>
                {statusOptions.map((opt) => (
                  <Radio key={opt.value} value={opt.value}>
                    {opt.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </BaseDrawer>
  )
}
