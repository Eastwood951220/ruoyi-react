import { useCallback, useRef, useState } from 'react'
import { Col, Form, Input, message, Radio, Row } from 'antd'
import BaseDrawer from '@/components/BaseDrawer'
import RichTextEditor from '@/components/RichTextEditor'
import DictSelect from '@/components/DictSelect'
import { addNotice, getNotice, updateNotice } from '@/api/system/notice'
import type { NoticeForm } from '@/api/system/notice/types'
import type { DictOption } from '@/store/useDictStore'

interface NoticeDrawerProps {
  open: boolean
  noticeId?: number | string
  noticeTypeOptions: DictOption[]
  noticeStatusOptions: DictOption[]
  onClose: () => void
  onSuccess: () => void
}

export default function NoticeDrawer(props: NoticeDrawerProps) {
  const {
    open,
    noticeId,
    noticeTypeOptions,
    noticeStatusOptions,
    onClose,
    onSuccess,
  } = props

  const [form] = Form.useForm<NoticeForm>()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [noticeContent, setNoticeContent] = useState('')
  const fetchedRef = useRef(false)

  const isEdit = noticeId !== undefined

  const handleAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return
      if (fetchedRef.current) return
      fetchedRef.current = true

      if (isEdit && noticeId !== undefined) {
        setLoading(true)
        getNotice(noticeId)
          .then((res) => {
            if (res.data) {
              form.setFieldsValue({
                noticeId: res.data.noticeId,
                noticeTitle: res.data.noticeTitle,
                noticeType: res.data.noticeType,
                status: res.data.status ?? '0',
                remark: res.data.remark ?? '',
              })
              setNoticeContent(res.data.noticeContent ?? '')
            }
          })
          .finally(() => setLoading(false))
      } else {
        form.setFieldsValue({
          status: '0',
          noticeType: '',
        })
        setNoticeContent('')
      }
    },
    [isEdit, noticeId, form],
  )

  const handleClose = () => {
    fetchedRef.current = false
    form.resetFields()
    setNoticeContent('')
    onClose()
  }

  const handleConfirm = async () => {
    if (loading) return
    const values = await form.validateFields()

    if (!noticeContent || noticeContent === '<p></p>') {
      void message.warning('公告内容不能为空')
      return
    }

    setSubmitting(true)
    try {
      const formData: NoticeForm = {
        ...values,
        noticeContent,
      }

      if (isEdit) {
        await updateNotice({ ...formData, noticeId })
        message.success('修改成功')
      } else {
        await addNotice(formData)
        message.success('新增成功')
      }
      form.resetFields()
      setNoticeContent('')
      fetchedRef.current = false
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const rules = {
    noticeTitle: [{ required: true, message: '公告标题不能为空' }],
    noticeType: [{ required: true, message: '公告类型不能为空' }],
  }

  return (
    <BaseDrawer
      open={open}
      title={isEdit ? '修改公告' : '添加公告'}
      width={780}
      loading={loading}
      confirmLoading={submitting}
      onClose={handleClose}
      onConfirm={handleConfirm}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="noticeTitle" label="公告标题" rules={rules.noticeTitle}>
              <Input placeholder="请输入公告标题" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="noticeType" label="公告类型" rules={rules.noticeType}>
              <DictSelect
                options={noticeTypeOptions}
                placeholder="请选择公告类型"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="状态">
              <Form.Item name="status" noStyle>
                <Radio.Group>
                  {noticeStatusOptions.map((item) => (
                    <Radio key={item.value} value={item.value}>{item.label}</Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="内容" required>
              <RichTextEditor
                value={noticeContent}
                onChange={setNoticeContent}
                placeholder="请输入公告内容"
                minHeight={192}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </BaseDrawer>
  )
}
