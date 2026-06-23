import { useCallback, useState } from 'react'
import { Button, DatePicker, Form, Input, message, Modal, Space } from 'antd'
import type { ColumnsType, SorterResult } from 'antd/es/table/interface'
import { DeleteOutlined, DownloadOutlined, UnlockOutlined, WarningOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import BaseListPage from '@/components/BaseListPage'
import AuthButton from '@/components/AuthButton'
import DictSelect from '@/components/DictSelect'
import DictTag from '@/components/DictTag'
import { useDict } from '@/hooks/useDict'
import { useTableList } from '@/hooks/useTableList'
import {
  listLoginInfo,
  delLoginInfo,
  cleanLoginInfo,
  unlockLoginInfo,
  exportLoginInfo,
} from '@/api/monitor/logininfor'
import type { LoginInfoQuery, LoginInfoVO } from '@/api/monitor/logininfor/types'
import styles from './index.module.less'

const { RangePicker } = DatePicker

type LoginInfoSearchForm = {
  ipaddr?: string
  userName?: string
  status?: string
  dateRange?: [Dayjs, Dayjs]
}

type LoginInfoListParams = Omit<LoginInfoQuery, 'pageNum' | 'pageSize'>

export default function LoginInfoPage() {
  const { sys_common_status, sys_device_type } = useDict('sys_common_status', 'sys_device_type')

  const [form] = Form.useForm<LoginInfoSearchForm>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [orderByColumn, setOrderByColumn] = useState('loginTime')
  const [isAsc, setIsAsc] = useState('descending')

  const buildQueryParams = useCallback(
    (formValues: LoginInfoSearchForm): LoginInfoListParams => ({
      ipaddr: formValues.ipaddr ?? '',
      userName: formValues.userName ?? '',
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
  } = useTableList<LoginInfoVO, LoginInfoSearchForm, LoginInfoListParams>({
    form,
    request: listLoginInfo,
    buildParams: buildQueryParams,
  })

  const handleSelectionChange = (keys: Array<number | string>, rows: LoginInfoVO[]) => {
    setSelectedRowKeys(keys)
    setSelectedNames(rows.map((r) => r.userName))
  }

  const handleDelete = (row?: LoginInfoVO) => {
    const infoIds = row?.infoId ?? selectedRowKeys
    if (!infoIds || (Array.isArray(infoIds) && infoIds.length === 0)) {
      void message.warning('请选择要删除的数据')
      return
    }
    Modal.confirm({
      title: '系统提示',
      content: `是否确认删除访问编号为"${Array.isArray(infoIds) ? infoIds.join(',') : infoIds}"的数据项?`,
      onOk: async () => {
        await delLoginInfo(infoIds)
        message.success('删除成功')
        setSelectedRowKeys([])
        setSelectedNames([])
        refresh()
      },
    })
  }

  const handleClean = () => {
    Modal.confirm({
      title: '系统提示',
      content: '是否确认清空所有登录日志数据项?',
      onOk: async () => {
        await cleanLoginInfo()
        message.success('清空成功')
        refresh()
      },
    })
  }

  const handleUnlock = () => {
    if (selectedNames.length === 0) {
      void message.warning('请选择要解锁的用户')
      return
    }
    const username = selectedNames.join(',')
    Modal.confirm({
      title: '系统提示',
      content: `是否确认解锁用户"${username}"数据项?`,
      onOk: async () => {
        await unlockLoginInfo(username)
        message.success(`用户${username}解锁成功`)
      },
    })
  }

  const handleExport = () => {
    const formValues = form.getFieldsValue()
    void exportLoginInfo({
      ...buildQueryParams(formValues),
      pageNum,
      pageSize,
    })
  }

  const handleSortChange = (_sorter: SorterResult<LoginInfoVO> | SorterResult<LoginInfoVO>[]) => {
    const sorter = Array.isArray(_sorter) ? _sorter[0] : _sorter
    if (sorter.columnKey && sorter.order) {
      setOrderByColumn(String(sorter.columnKey))
      setIsAsc(sorter.order)
    } else {
      setOrderByColumn('loginTime')
      setIsAsc('descending')
    }
  }

  const single = selectedRowKeys.length !== 1
  const multiple = selectedRowKeys.length === 0

  const columns: ColumnsType<LoginInfoVO> = [
    { title: '访问编号', dataIndex: 'infoId', width: 100, align: 'center' },
    {
      title: '用户名称',
      dataIndex: 'userName',
      width: 120,
      ellipsis: true,
      sorter: true,
    },
    { title: '客户端', dataIndex: 'clientKey', width: 100, ellipsis: true },
    {
      title: '设备类型',
      dataIndex: 'deviceType',
      width: 100,
      align: 'center',
      render: (value: string) => (
        <DictTag options={sys_device_type} value={value} />
      ),
    },
    { title: '地址', dataIndex: 'ipaddr', width: 130, ellipsis: true },
    { title: '登录地点', dataIndex: 'loginLocation', width: 150, ellipsis: true },
    { title: '操作系统', dataIndex: 'os', width: 120, ellipsis: true },
    { title: '浏览器', dataIndex: 'browser', width: 120, ellipsis: true },
    {
      title: '登录状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (value: string) => (
        <DictTag options={sys_common_status} value={value} />
      ),
    },
    { title: '描述', dataIndex: 'msg', ellipsis: true },
    {
      title: '访问时间',
      dataIndex: 'loginTime',
      width: 180,
      sorter: true,
      defaultSortOrder: 'descend',
    },
  ]

  const queryNode = (
    <Form form={form} layout="inline">
      <Form.Item name="ipaddr">
        <Input placeholder="登录地址" allowClear />
      </Form.Item>
      <Form.Item name="userName">
        <Input placeholder="用户名称" allowClear />
      </Form.Item>
      <Form.Item name="status">
        <DictSelect options={sys_common_status} placeholder="登录状态" allowClear style={{ width: 160 }} />
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
      <AuthButton danger icon={<DeleteOutlined />} permission="monitor:logininfor:remove" disabled={multiple} onClick={() => handleDelete()}>
        删除
      </AuthButton>
      <AuthButton danger icon={<WarningOutlined />} permission="monitor:logininfor:remove" onClick={handleClean}>
        清空
      </AuthButton>
      <AuthButton icon={<UnlockOutlined />} permission="monitor:logininfor:unlock" disabled={single} onClick={handleUnlock}>
        解锁
      </AuthButton>
      <AuthButton icon={<DownloadOutlined />} permission="monitor:logininfor:export" onClick={handleExport}>
        导出
      </AuthButton>
    </>
  )

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <BaseListPage<LoginInfoVO>
          rowKey="infoId"
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
            onChange: (keys, rows) => handleSelectionChange(keys as Array<number | string>, rows as LoginInfoVO[]),
          }}
          queryNode={queryNode}
          toolbarLeft={toolbarLeft}
          onRefresh={refresh}
          storageKey="monitor-logininfor-columns"
          tableProps={{
            onChange: (_pagination, _filters, sorter) => {
              handleSortChange(sorter as SorterResult<LoginInfoVO> | SorterResult<LoginInfoVO>[])
            },
          }}
        />
      </div>
    </div>
  )
}
