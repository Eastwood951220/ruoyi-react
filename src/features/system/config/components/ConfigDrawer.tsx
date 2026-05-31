import { useRef, useState } from 'react'
import { Col, Form, Input, message, Radio, Row } from 'antd'
import BaseDrawer from '@/components/BaseDrawer'
import { addConfig, getConfig, updateConfig } from '@/api/system/config'
import type { ConfigForm } from '@/api/system/config/types'
import type { DictOption } from '@/store/useDictStore'

interface ConfigDrawerProps {
  open: boolean
  configId?: number | string
  typeOptions: DictOption[]
  onClose: () => void
  onSuccess: () => void
}

export default function ConfigDrawer(props: ConfigDrawerProps) {
  const { open, configId, typeOptions, onClose, onSuccess } = props

  const [form] = Form.useForm<ConfigForm>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fetchedRef = useRef(false)

  const isEdit = configId !== undefined

  const handleAfterOpenChange = (isOpen: boolean) => {
    if (!isOpen) return
    if (fetchedRef.current) return
    fetchedRef.current = true

    if (isEdit && configId !== undefined) {
      setLoading(true)
      getConfig(configId)
        .then((res) => {
          const data = res.data
          if (data) {
            form.setFieldsValue({
              configId: data.configId,
              configName: data.configName,
              configKey: data.configKey,
              configValue: data.configValue,
              configType: data.configType,
              remark: data.remark ?? '',
            })
          }
        })
        .finally(() => setLoading(false))
    } else {
      form.setFieldsValue({ configType: 'Y' })
    }
  }

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
        await updateConfig({ ...values, configId })
        message.success('修改成功')
      } else {
        await addConfig(values)
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
    configName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
    configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
    configValue: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }],
  }

  return (
    <BaseDrawer
      open={open}
      title={isEdit ? '修改参数' : '添加参数'}
      loading={loading}
      confirmLoading={submitting}
      onClose={handleClose}
      onConfirm={handleConfirm}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="configName" label="参数名称" rules={rules.configName}>
              <Input placeholder="请输入参数名称" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="configKey" label="参数键名" rules={rules.configKey}>
              <Input placeholder="请输入参数键名" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="configValue" label="参数键值" rules={rules.configValue}>
              <Input.TextArea rows={3} placeholder="请输入参数键值" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="configType" label="系统内置">
              <Radio.Group>
                {typeOptions.map((opt) => (
                  <Radio key={opt.value} value={opt.value}>
                    {opt.label}
                  </Radio>
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
