import { useState } from 'react'
import { Checkbox, message, Modal, Upload } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { globalHeaders } from '@/request'

const { Dragger } = Upload

interface UserImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  onDownloadTemplate: () => void
}

export default function UserImportModal(props: UserImportModalProps) {
  const { open, onClose, onSuccess, onDownloadTemplate } = props
  const [updateSupport, setUpdateSupport] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  const uploadUrl = `${import.meta.env.VITE_APP_BASE_API}/system/user/importData`

  const handleUpload: UploadProps['customRequest'] = (options) => {
    const { file, onSuccess: uploadSuccess, onError } = options
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file as File)

    const url = `${uploadUrl}?updateSupport=${updateSupport ? 1 : 0}`

    fetch(url, {
      method: 'POST',
      headers: globalHeaders(),
      body: formData,
    })
      .then((resp) => resp.json())
      .then((data) => {
        setUploading(false)
        if (data.code === 200 || data.code === 0) {
          message.success(data.msg || '导入成功')
          setFileList([])
          uploadSuccess?.(data)
          onSuccess()
        } else {
          message.error(data.msg || '导入失败')
          onError?.(new Error(data.msg))
        }
      })
      .catch((err) => {
        setUploading(false)
        message.error('导入失败')
        onError?.(err)
      })
  }

  const handleClose = () => {
    setFileList([])
    setUpdateSupport(false)
    onClose()
  }

  return (
    <Modal
      title="用户导入"
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
    >
      <Dragger
        name="file"
        multiple={false}
        accept=".xlsx,.xls"
        fileList={fileList}
        onChange={({ fileList: list }) => setFileList(list)}
        customRequest={handleUpload}
        disabled={uploading}
        maxCount={1}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">将文件拖到此区域，或点击上传</p>
        <p className="ant-upload-hint">仅允许导入 xls、xlsx 格式文件。</p>
      </Dragger>
      <div style={{ marginTop: 16 }}>
        <Checkbox
          checked={updateSupport}
          onChange={(e) => setUpdateSupport(e.target.checked)}
        >
          是否更新已经存在的用户数据
        </Checkbox>
      </div>
      <div style={{ marginTop: 8 }}>
        <a onClick={onDownloadTemplate}>下载导入模板</a>
      </div>
    </Modal>
  )
}
