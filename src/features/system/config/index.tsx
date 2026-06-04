import { useCallback, useState } from 'react'
import { Button, DatePicker, Form, Input, message, Modal, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, SyncOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import AuthButton from '@/components/AuthButton'
import BaseListPage from '@/components/BaseListPage'
import DictSelect from '@/components/DictSelect'
import DictTag from '@/components/DictTag'
import { useDict } from '@/hooks/useDict'
import { useTableList } from '@/hooks/useTableList'
import {
  listConfig,
  delConfig,
  refreshCache,
  exportConfig,
} from '@/api/system/config'
import type { ConfigQuery, ConfigVO } from '@/api/system/config/types'
import ConfigDrawer from './components/ConfigDrawer'
import styles from './index.module.less'

const { RangePicker } = DatePicker

type ConfigSearchForm = {
  configName?: string
  configKey?: string
  configType?: string
  dateRange?: [Dayjs, Dayjs]
}

type ConfigListParams = Omit<ConfigQuery, 'pageNum' | 'pageSize'>

export default function ConfigPage() {
  const { sys_yes_no } = useDict('sys_yes_no')

  const [form] = Form.useForm<ConfigSearchForm>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editConfigId, setEditConfigId] = useState<number | string | undefined>()

  const buildQueryParams = useCallback((formValues: ConfigSearchForm): ConfigListParams => {
    const beginTime = formValues.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss') ?? ''
    const endTime = formValues.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss') ?? ''
    return {
      configName: formValues.configName ?? '',
      configKey: formValues.configKey ?? '',
      configType: formValues.configType ?? '',
      beginTime,
      endTime,
    }
  }, [])

  const {
    dataList,
    total,
    loading,
    pageNum,
    pageSize,
    search: handleSearch,
    reset: handleReset,
    refresh,
    changePage,
  } = useTableList<ConfigVO, ConfigSearchForm, ConfigListParams>({
    form,
    request: listConfig,
    buildParams: buildQueryParams,
  })

  const handleDelete = (configId: number | string | Array<number | string>) => {
    const ids = Array.isArray(configId) ? configId : [configId]
    const label = ids.length === 1 ? `参数编号为"${ids[0]}"` : `选中的${ids.length}条数据`
    Modal.confirm({
      title: '系统提示',
      content: `是否确认删除${label}？`,
      onOk: async () => {
        await delConfig(ids)
        message.success('删除成功')
        setSelectedRowKeys([])
        refresh()
      },
    })
  }

  const handleExport = () => {
    const formValues = form.getFieldsValue()
    void exportConfig({
      ...buildQueryParams(formValues),
      pageNum,
      pageSize,
    })
  }

  const handleRefreshCache = async () => {
    await refreshCache()
    message.success('刷新缓存成功')
  }

  const handleAdd = () => {
    setEditConfigId(undefined)
    setDrawerOpen(true)
  }

  const handleEdit = (configId: number | string) => {
    setEditConfigId(configId)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditConfigId(undefined)
  }

  const handleDrawerSuccess = () => {
    setDrawerOpen(false)
    setEditConfigId(undefined)
    refresh()
  }

  const single = selectedRowKeys.length !== 1
  const multiple = selectedRowKeys.length === 0

  // ---- 查询区域 ----
  const queryNode = (
    <Form form={form} layout="inline">
      <Form.Item name="configName">
        <Input placeholder="参数名称" allowClear />
      </Form.Item>
      <Form.Item name="configKey">
        <Input placeholder="参数键名" allowClear />
      </Form.Item>
      <Form.Item name="configType">
        <DictSelect
          options={sys_yes_no}
          placeholder="系统内置"
          allowClear
          style={{ width: 160 }}
        />
      </Form.Item>
      <Form.Item name="dateRange">
        <RangePicker />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={() => handleSearch()}>搜索</Button>
          <Button onClick={() => handleReset()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )

  // ---- 工具栏左侧按钮 ----
  const toolbarLeft = (
    <>
      <AuthButton type="primary" icon={<PlusOutlined />} permission="system:config:add" onClick={handleAdd}>
        新增
      </AuthButton>
      <AuthButton
        permission="system:config:edit"
        disabled={single}
        onClick={() => handleEdit(selectedRowKeys[0])}
      >
        修改
      </AuthButton>
      <AuthButton
        danger
        permission="system:config:remove"
        disabled={multiple}
        onClick={() => handleDelete(selectedRowKeys)}
      >
        删除
      </AuthButton>
      <AuthButton permission="system:config:export" onClick={handleExport}>导出</AuthButton>
      <AuthButton icon={<SyncOutlined />} permission="system:config:remove" onClick={handleRefreshCache}>
        刷新缓存
      </AuthButton>
    </>
  )

  // ---- 表格列 ----
  const columns: ColumnsType<ConfigVO> = [
    { title: '参数名称', dataIndex: 'configName', ellipsis: true },
    { title: '参数键名', dataIndex: 'configKey', ellipsis: true },
    { title: '参数键值', dataIndex: 'configValue', ellipsis: true },
    {
      title: '系统内置',
      dataIndex: 'configType',
      width: 100,
      render: (value: string) => (
        <DictTag options={sys_yes_no} value={value} />
      ),
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <AuthButton type="link" size="small" permission="system:config:edit" onClick={() => handleEdit(record.configId)}>
            修改
          </AuthButton>
          <AuthButton type="link" size="small" danger permission="system:config:remove" onClick={() => handleDelete(record.configId)}>
            删除
          </AuthButton>
        </Space>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <BaseListPage<ConfigVO>
        rowKey="configId"
        columns={columns}
        dataSource={dataList}
        loading={loading}
        pagination={{
          current: pageNum,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: changePage,
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as Array<number | string>),
        }}
        queryNode={queryNode}
        toolbarLeft={toolbarLeft}
        onRefresh={refresh}
        storageKey="system-config-columns"
      />

      <ConfigDrawer
        open={drawerOpen}
        configId={editConfigId}
        typeOptions={sys_yes_no}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSuccess}
      />
    </div>
  )
}
