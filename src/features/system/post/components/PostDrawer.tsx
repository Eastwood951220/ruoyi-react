import { useCallback, useRef, useState } from 'react'
import { Col, Form, Input, InputNumber, message, Radio, Row, TreeSelect } from 'antd'
import BaseDrawer from '@/components/BaseDrawer'
import { addPost, getPost, updatePost } from '@/api/system/post'
import type { PostForm } from '@/api/system/post/types'
import type { DeptTreeNode } from '@/api/system/dept/types'
import { useDict } from '@/hooks/useDict'

interface PostDrawerProps {
  open: boolean
  postId?: number | string
  deptTree: DeptTreeNode[]
  onClose: () => void
  onSuccess: () => void
}

export default function PostDrawer(props: PostDrawerProps) {
  const { open, postId, deptTree, onClose, onSuccess } = props

  const { sys_normal_disable } = useDict('sys_normal_disable')
  const [form] = Form.useForm<PostForm>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fetchedRef = useRef(false)

  const isEdit = postId !== undefined

  const handleAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return
      if (fetchedRef.current) return
      fetchedRef.current = true

      if (isEdit && postId !== undefined) {
        setLoading(true)
        getPost(postId)
          .then((res) => {
            if (res.data) {
              form.setFieldsValue({
                postId: res.data.postId,
                deptId: res.data.deptId,
                postCode: res.data.postCode,
                postName: res.data.postName,
                postCategory: res.data.postCategory ?? '',
                postSort: res.data.postSort ?? 0,
                status: res.data.status ?? '0',
                remark: res.data.remark ?? '',
              })
            }
          })
          .finally(() => setLoading(false))
      } else {
        form.setFieldsValue({
          status: '0',
          postSort: 0,
        })
      }
    },
    [isEdit, postId, form],
  )

  const handleClose = () => {
    fetchedRef.current = false
    form.resetFields()
    onClose()
  }

  const handleConfirm = async () => {
    if (loading) return
    const values = await form.validateFields()
    setSubmitting(true)

    try {
      if (isEdit) {
        await updatePost({ ...values, postId })
        message.success('修改成功')
      } else {
        await addPost(values)
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
    postName: [{ required: true, message: '岗位名称不能为空' }],
    postCode: [{ required: true, message: '岗位编码不能为空' }],
    deptId: [{ required: true, message: '部门不能为空' }],
    postSort: [{ required: true, message: '岗位顺序不能为空' }],
  }

  const treeSelectData = [{ id: 0, label: '顶级部门', children: deptTree }]

  return (
    <BaseDrawer
      open={open}
      title={isEdit ? '修改岗位' : '添加岗位'}
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
            <Form.Item name="deptId" label="部门" rules={rules.deptId}>
              <TreeSelect
                treeData={treeSelectData}
                fieldNames={{ value: 'id', label: 'label', children: 'children' }}
                placeholder="请选择部门"
                treeDefaultExpandAll
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="postName" label="岗位名称" rules={rules.postName}>
              <Input placeholder="请输入岗位名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="postCode" label="岗位编码" rules={rules.postCode}>
              <Input placeholder="请输入岗位编码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="postCategory" label="类别编码">
              <Input placeholder="请输入类别编码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="postSort" label="岗位排序" rules={rules.postSort}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="状态">
              <Radio.Group>
                {sys_normal_disable.map((item) => (
                  <Radio key={item.value} value={item.value}>{item.label}</Radio>
                ))}
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
