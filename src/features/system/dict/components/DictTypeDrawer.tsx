import { useCallback, useRef, useState } from 'react'
import { Form, Input, message } from 'antd'
import BaseDrawer from '@/components/BaseDrawer'
import { addType, getType, updateType } from '@/api/system/dict/type'
import type { DictTypeForm } from '@/api/system/dict/type/types'

interface DictTypeDrawerProps {
  open: boolean
  dictId?: number | string
  onClose: () => void
  onSuccess: () => void
}

export default function DictTypeDrawer({ open, dictId, onClose, onSuccess }: DictTypeDrawerProps) {
  const [form] = Form.useForm<DictTypeForm>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEdit = dictId !== undefined
  const fetchedRef = useRef(false)

  const handleAfterOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) return
    if (fetchedRef.current) return
    fetchedRef.current = true

    if (isEdit && dictId !== undefined) {
      setLoading(true)
      getType(dictId)
        .then((res) => {
          const data = res.data
          if (data) {
            form.setFieldsValue({
              dictId: data.dictId,
              dictName: data.dictName,
              dictType: data.dictType,
              remark: data.remark ?? '',
            })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [isEdit, dictId, form])

  const handleClose = () => {
    fetchedRef.current = false
    form.resetFields()
    onClose()
  }

  const handleConfirm = async () => {
    const values = await form.validateFields()
    setSubmitting(true)

    try {
      if (isEdit) {
        await updateType({ ...values, dictId })
        message.success('修改成功')
      } else {
        await addType(values)
        message.success('新增成功')
      }
      form.resetFields()
      fetchedRef.current = false
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BaseDrawer
      open={open}
      title={isEdit ? '修改字典类型' : '新增字典类型'}
      loading={loading}
      confirmLoading={submitting}
      onClose={handleClose}
      onConfirm={handleConfirm}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item name="dictName" label="字典名称" rules={[{ required: true, message: '字典名称不能为空' }]}>
          <Input placeholder="请输入字典名称" />
        </Form.Item>
        <Form.Item name="dictType" label="字典类型" rules={[{ required: true, message: '字典类型不能为空' }, { max: 100 }]}>
          <Input placeholder="请输入字典类型" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </BaseDrawer>
  )
}
