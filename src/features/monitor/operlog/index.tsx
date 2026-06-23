import { useCallback, useState } from 'react'
import { Button, DatePicker, Form, Input, message, Modal, Space } from 'antd'
import type { ColumnsType, SorterResult } from 'antd/es/table/interface'
import { DeleteOutlined, DownloadOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import BaseListPage from '@/components/BaseListPage'
import AuthButton from '@/components/AuthButton'
import DictSelect from '@/components/DictSelect'
import DictTag from '@/components/DictTag'
import { useDict } from '@/hooks/useDict'
import { useTableList } from '@/hooks/useTableList'
import { listOperLog, delOperLog, cleanOperLog, exportOperLog } from '@/api/monitor/operlog'
import type { OperLogQuery, OperLogVO } from '@/api/monitor/operlog/types'
import OperLogDetailDrawer from './components/OperLogDetailDrawer'
import styles from './index.module.less'

const { RangePicker } = DatePicker

type OperLogSearchForm = {
  operIp?: string
  title?: string
  operName?: string
  businessType?: string
  status?: string
  dateRange?: [Dayjs, Dayjs]
}

type OperLogListParams = Omit<OperLogQuery, 'pageNum' | 'pageSize'>

export default function OperLogPage() {
  const { sys_oper_type, sys_common_status } = useDict('sys_oper_type', 'sys_common_status')

  const [form] = Form.useForm<OperLogSearchForm>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])
  const [orderByColumn, setOrderByColumn] = useState('operTime')
  const [isAsc, setIsAsc] = useState('descending')

  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<OperLogVO | null>(null)

  const buildQueryParams = useCallback(
    (formValues: OperLogSearchForm): OperLogListParams => ({
      operIp: formValues.operIp ?? '',
      title: formValues.title ?? '',
      operName: formValues.operName ?? '',
      businessType: formValues.businessType ?? '',
      status: formValues.status ?? '',
      orderByColumn,
      isAsc,
      beginTime: formValues.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss') ?? '',
      endTime: formValues.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss') ?? '',
    }),
    [orderByColumn, isAsc],
  )

  const {
    dataList,
    total,
    loading,
    pageNum,
    pageSize,
    search,
    reset,
    refresh,
    changePage,
  } = useTableList<OperLogVO, OperLogSearchForm, OperLogListParams>({
    form,
    request: listOperLog,
    buildParams: buildQueryParams,
  })

  const handleDelete = (row?: OperLogVO) => {
    const operIds = row?.operId ?? selectedRowKeys
    if (!operIds || (Array.isArray(operIds) && operIds.length === 0)) {
      void message.warning('请选择要删除的数据')
      return
    }
    Modal.confirm({
      title: '系统提示',
      content: `是否确认删除日志编号为"${Array.isArray(operIds) ? operIds.join(',') : operIds}"的数据项?`,
      onOk: async () => {
        await delOperLog(operIds)
        message.success('删除成功')
        setSelectedRowKeys([])
        refresh()
      },
    })
  }

  const handleClean = () => {
    Modal.confirm({
      title: '系统提示',
      content: '是否确认清空所有操作日志数据项?',
      onOk: async () => {
        await cleanOperLog()
        message.success('清空成功')
        refresh()
      },
    })
  }

  const handleExport = () => {
    const formValues = form.getFieldsValue()
    void exportOperLog({
      ...buildQueryParams(formValues),
      pageNum,
      pageSize,
    })
  }

  const handleView = (row: OperLogVO) => {
    setDetailRow(row)
    setDetailOpen(true)
  }

  const handleSortChange = (_sorter: SorterResult<OperLogVO> | SorterResult<OperLogVO>[]) => {
    const sorter = Array.isArray(_sorter) ? _sorter[0] : _sorter
    if (sorter.columnKey && sorter.order) {
      setOrderByColumn(String(sorter.columnKey))
      setIsAsc(sorter.order)
    } else {
      setOrderByColumn('operTime')
      setIsAsc('descending')
    }
  }

  const multiple = selectedRowKeys.length === 0

  const columns: ColumnsType<OperLogVO> = [
    { title: '日志编号', dataIndex: 'operId', width: 100, align: 'center' },
    { title: '系统模块', dataIndex: 'title', ellipsis: true },
    {
      title: '操作类型',
      dataIndex: 'businessType',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <DictTag options={sys_oper_type} value={String(value)} />
      ),
    },
    {
      title: '操作人员',
      dataIndex: 'operName',
      width: 110,
      ellipsis: true,
      sorter: true,
      defaultSortOrder: undefined,
    },
    { title: '部门', dataIndex: 'deptName', width: 130, ellipsis: true },
    { title: '操作地址', dataIndex: 'operIp', width: 130, ellipsis: true },
    {
      title: '操作状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <DictTag options={sys_common_status} value={String(value)} />
      ),
    },
    {
      title: '操作日期',
      dataIndex: 'operTime',
      width: 180,
      sorter: true,
      defaultSortOrder: 'descend',
    },
    {
      title: '消耗时间',
      dataIndex: 'costTime',
      width: 110,
      align: 'center',
      ellipsis: true,
      sorter: true,
      render: (value: number) => `${value}ms`,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_: unknown, record: OperLogVO) => (
        <AuthButton type="link" size="small" permission="monitor:operlog:query" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          详细
        </AuthButton>
      ),
    },
  ]

  const queryNode = (
    <Form form={form} layout="inline">
      <Form.Item name="operIp">
        <Input placeholder="操作地址" allowClear />
      </Form.Item>
      <Form.Item name="title">
        <Input placeholder="系统模块" allowClear />
      </Form.Item>
      <Form.Item name="operName">
        <Input placeholder="操作人员" allowClear />
      </Form.Item>
      <Form.Item name="businessType">
        <DictSelect options={sys_oper_type} placeholder="操作类型" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="status">
        <DictSelect options={sys_common_status} placeholder="操作状态" allowClear style={{ width: 160 }} />
      </Form.Item>
      <Form.Item name="dateRange">
        <RangePicker showTime />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={() => search()}>搜索</Button>
          <Button onClick={() => reset()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )

  const toolbarLeft = (
    <>
      <AuthButton danger icon={<DeleteOutlined />} permission="monitor:operlog:remove" disabled={multiple} onClick={() => handleDelete()}>
        删除
      </AuthButton>
      <AuthButton danger icon={<WarningOutlined />} permission="monitor:operlog:remove" onClick={handleClean}>
        清空
      </AuthButton>
      <AuthButton icon={<DownloadOutlined />} permission="monitor:operlog:export" onClick={handleExport}>
        导出
      </AuthButton>
    </>
  )

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <BaseListPage<OperLogVO>
          rowKey="operId"
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
          storageKey="monitor-operlog-columns"
          tableProps={{
            onChange: (_pagination, _filters, sorter) => {
              handleSortChange(sorter as SorterResult<OperLogVO> | SorterResult<OperLogVO>[])
            },
          }}
        />
      </div>

      <OperLogDetailDrawer
        open={detailOpen}
        data={detailRow}
        operTypeOptions={sys_oper_type}
        statusOptions={sys_common_status}
        onClose={() => { setDetailOpen(false); setDetailRow(null) }}
      />
    </div>
  )
}
