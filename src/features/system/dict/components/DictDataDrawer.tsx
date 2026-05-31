import { useCallback, useRef, useState } from 'react'
import { Form, Input, InputNumber, Select, message } from 'antd'
import BaseDrawer from '@/components/BaseDrawer'
import { addData, getData, updateData } from '@/api/system/dict/data'
import type { DictDataForm, DictDataListClass } from '@/api/system/dict/data/types'
import { useDictStore } from '@/store/useDictStore'

const LIST_CLASS_OPTIONS: { value: DictDataListClass; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'primary', label: '主要' },
  { value: 'success', label: '成功' },
  { value: 'info', label: '信息' },
  { value: 'warning', label: '警告' },
  { value: 'danger', label: '危险' },
]

interface DictDataDrawerProps {
  open: boolean
  dictType: string
  dictCode?: number | string
  onClose: () => void
  onSuccess: () => void
}

export default function DictDataDrawer({ open, dictType, dictCode, onClose, onSuccess }: DictDataDrawerProps) {
  const [form] = Form.useForm<DictDataForm>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEdit = dictCode !== undefined
  const removeDict = useDictStore((state) => state.removeDict)
  const fetchedRef = useRef(false)

  const handleAfterOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) return
    if (fetchedRef.current) return
    fetchedRef.current = true

    form.setFieldValue('dictType', dictType)

    if (isEdit && dictCode !== undefined) {
      setLoading(true)
      getData(dictCode)
        .then((res) => {
          const data = res.data
          if (data) {
            form.setFieldsValue({
              dictCode: data.dictCode,
              dictType: data.dictType,
              dictLabel: data.dictLabel,
              dictValue: data.dictValue,
              cssClass: data.cssClass ?? '',
              listClass: data.listClass ?? 'default',
              dictSort: data.dictSort,
              remark: data.remark ?? '',
            })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [isEdit, dictCode, dictType, form])

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
        await updateData({ ...values, dictCode })
        message.success('修改成功')
      } else {
        await addData(values)
        message.success('新增成功')
      }
      removeDict(dictType)
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
      title={isEdit ? '修改字典数据' : '新增字典数据'}
      loading={loading}
      confirmLoading={submitting}
      onClose={handleClose}
      onConfirm={handleConfirm}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item name="dictType" label="字典类型">
          <Input disabled />
        </Form.Item>
        <Form.Item name="dictLabel" label="数据标签" rules={[{ required: true, message: '数据标签不能为空' }]}>
          <Input placeholder="请输入数据标签" />
        </Form.Item>
        <Form.Item name="dictValue" label="数据键值" rules={[{ required: true, message: '数据键值不能为空' }]}>
          <Input placeholder="请输入数据键值" />
        </Form.Item>
        <Form.Item name="cssClass" label="样式属性">
          <Input placeholder="请输入样式属性" />
        </Form.Item>
        <Form.Item name="dictSort" label="显示排序" rules={[{ required: true, message: '数据顺序不能为空' }]}>
          <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入排序" />
        </Form.Item>
        <Form.Item name="listClass" label="回显样式">
          <Select options={LIST_CLASS_OPTIONS} placeholder="请选择回显样式" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </BaseDrawer>
  )
}
