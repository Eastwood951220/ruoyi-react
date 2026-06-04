import {useCallback, useState} from 'react'
import {Button, DatePicker, Form, Input, message, Modal, Space} from 'antd'
import type {ColumnsType} from 'antd/es/table'
import {PlusOutlined, SyncOutlined} from '@ant-design/icons'
import {useNavigate} from '@tanstack/react-router'
import type {Dayjs} from 'dayjs'
import AuthButton from '@/components/AuthButton'
import BaseListPage from '@/components/BaseListPage'
import {useTableList} from '@/hooks/useTableList'
import {delType, exportType, listType, refreshCache} from '@/api/system/dict/type'
import type {DictTypeQuery, DictTypeVO} from '@/api/system/dict/type/types'
import {useDictStore} from '@/store/useDictStore'
import DictTypeDrawer from './components/DictTypeDrawer'

const {RangePicker} = DatePicker

type DictSearchForm = {
	dictName?: string
	dictType?: string
	dateRange?: [Dayjs, Dayjs]
}

type DictTypeListParams = Omit<DictTypeQuery, 'pageNum' | 'pageSize'>

export default function DictPage() {
	const navigate = useNavigate()
	const [form] = Form.useForm<DictSearchForm>()
	const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [editDictId, setEditDictId] = useState<number | string | undefined>()
	const cleanDict = useDictStore((state) => state.cleanDict)

	const buildQueryParams = useCallback((formValues: DictSearchForm): DictTypeListParams => {
		const beginTime = formValues.dateRange?.[0]?.format('YYYY-MM-DD') ?? ''
		const endTime = formValues.dateRange?.[1]?.format('YYYY-MM-DD') ?? ''
		return {
			dictName: formValues.dictName ?? '',
			dictType: formValues.dictType ?? '',
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
	} = useTableList<DictTypeVO, DictSearchForm, DictTypeListParams>({
		form,
		request: listType,
		buildParams: buildQueryParams,
	})
	
	const handleDelete = (dictId: number | string) => {
		Modal.confirm({
			title: '系统提示',
			content: `是否确认删除字典编号为"${dictId}"的数据项？`,
			onOk: async () => {
				await delType(dictId)
				message.success('删除成功')
				refresh()
			},
		})
	}
	
	const handleBatchDelete = () => {
		if (selectedRowKeys.length === 0) {
			return message.warning('请选择要删除的数据')
		}
		Modal.confirm({
			title: '系统提示',
			content: `是否确认删除选中的${selectedRowKeys.length}条数据？`,
			onOk: async () => {
				await delType(selectedRowKeys)
				message.success('删除成功')
				setSelectedRowKeys([])
				refresh()
			},
		})
	}
	
	const handleExport = () => {
		const formValues = form.getFieldsValue()
		void exportType(buildQueryParams(formValues))
	}
	
	const handleRefreshCache = async () => {
		await refreshCache()
		cleanDict()
		message.success('刷新成功')
	}
	
	const handleAdd = () => {
		setEditDictId(undefined)
		setDrawerOpen(true)
	}
	
	const handleEdit = (dictId: number | string) => {
		setEditDictId(dictId)
		setDrawerOpen(true)
	}
	
	const handleDrawerClose = () => {
		setDrawerOpen(false)
		setEditDictId(undefined)
	}
	
	const handleDrawerSuccess = () => {
		setDrawerOpen(false)
		setEditDictId(undefined)
		refresh()
	}
	
	const handleViewData = (record: DictTypeVO) => {
		void navigate({
			to: '/system/dict-data',
			search: {dictType: record.dictType, dictName: record.dictName},
		})
	}
	
	// ---- 查询区域 ----
	const queryNode = (
		<Form form={form} layout="inline">
			<Form.Item name="dictName">
				<Input placeholder="字典名称" allowClear/>
			</Form.Item>
			<Form.Item name="dictType">
				<Input placeholder="字典类型" allowClear/>
			</Form.Item>
			<Form.Item name="dateRange">
				<RangePicker/>
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
			<AuthButton type="primary" icon={<PlusOutlined/>} permission="system:dict:add" onClick={handleAdd}>
				新增
			</AuthButton>
			<AuthButton danger permission="system:dict:remove" onClick={handleBatchDelete}
			            disabled={selectedRowKeys.length === 0}>
				批量删除
			</AuthButton>
			<AuthButton permission="system:dict:export" onClick={handleExport}>导出</AuthButton>
			<Button icon={<SyncOutlined/>} onClick={handleRefreshCache}>刷新缓存</Button>
		</>
	)
	
	// ---- 表格列 ----
	const columns: ColumnsType<DictTypeVO> = [
		{title: '字典编号', dataIndex: 'dictId', width: 100, ellipsis: true},
		{title: '字典名称', dataIndex: 'dictName', ellipsis: true},
		{
			title: '字典类型',
			dataIndex: 'dictType',
			render: (text: string, record) => (
				<Button type="link" size="small" onClick={() => handleViewData(record)}>
					{text}
				</Button>
			),
		},
		{title: '备注', dataIndex: 'remark', ellipsis: true},
		{title: '创建时间', dataIndex: 'createTime', width: 200},
		{
			title: '操作',
			key: 'action',
			width: 180,
			render: (_, record) => (
				<Space size="small">
					<AuthButton type="link" size="small" permission="system:dict:edit"
					            onClick={() => handleEdit(record.dictId)}>
						修改
					</AuthButton>
					<AuthButton type="link" size="small" danger permission="system:dict:remove"
					            onClick={() => handleDelete(record.dictId)}>
						删除
					</AuthButton>
					<Button type="link" size="small" onClick={() => handleViewData(record)}>
						数据
					</Button>
				</Space>
			),
		},
	]
	
	return (
		<>
			<BaseListPage<DictTypeVO>
				rowKey="dictId"
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
				storageKey="system-dict-type-columns"
			/>
			
			<DictTypeDrawer
				open={drawerOpen}
				dictId={editDictId}
				onClose={handleDrawerClose}
				onSuccess={handleDrawerSuccess}
			/>
		</>
	)
}
