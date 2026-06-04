import {useCallback, useState} from 'react'
import {Button, Card, Form, Input, message, Modal, Space, Tag} from 'antd'
import type {ColumnsType} from 'antd/es/table'
import {ArrowLeftOutlined, PlusOutlined} from '@ant-design/icons'
import {useNavigate, useSearch} from '@tanstack/react-router'
import AuthButton from '@/components/AuthButton'
import BaseListPage from '@/components/BaseListPage'
import {useTableList} from '@/hooks/useTableList'
import {delData, exportData, listData} from '@/api/system/dict/data'
import type {DictDataListClass, DictDataQuery, DictDataVO} from '@/api/system/dict/data/types'
import {useDictStore} from '@/store/useDictStore'
import {useTagsViewStore} from '@/store/useTagsViewStore'
import DictDataDrawer from './components/DictDataDrawer'
import styles from './data.module.less'

const LIST_CLASS_COLOR: Record<DictDataListClass, string> = {
	default: 'default',
	primary: 'blue',
	success: 'green',
	info: 'cyan',
	warning: 'orange',
	danger: 'red',
}

type DictDataSearchForm = {
	dictLabel?: string
}

type DictDataListParams = Omit<DictDataQuery, 'pageNum' | 'pageSize'>

export default function DictDataPage() {
	const navigate = useNavigate()
	const search = useSearch({strict: false}) as Record<string, string | undefined>
	const dictType = search.dictType ?? ''
	const dictName = search.dictName ?? ''
	
	const [form] = Form.useForm<DictDataSearchForm>()
	const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [editDictCode, setEditDictCode] = useState<number | string | undefined>()
	const removeDict = useDictStore((state) => state.removeDict)

	const buildQueryParams = useCallback((formValues: DictDataSearchForm): DictDataListParams => ({
		dictType,
		dictLabel: formValues.dictLabel ?? '',
	}), [dictType])

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
	} = useTableList<DictDataVO, DictDataSearchForm, DictDataListParams>({
		form,
		request: listData,
		buildParams: buildQueryParams,
		reloadKey: dictType,
	})

	const refreshAndDropCache = () => {
		if (dictType) {
			removeDict(dictType)
		}
		refresh()
	}
	
	const handleDelete = (dictCode: number | string) => {
		Modal.confirm({
			title: '系统提示',
			content: `是否确认删除字典编码为"${dictCode}"的数据项？`,
			onOk: async () => {
				await delData(dictCode)
				message.success('删除成功')
				refreshAndDropCache()
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
				await delData(selectedRowKeys)
				message.success('删除成功')
				setSelectedRowKeys([])
				refreshAndDropCache()
			},
		})
	}
	
	const handleExport = () => {
		const formValues = form.getFieldsValue()
		void exportData(buildQueryParams(formValues))
	}
	
	const handleAdd = () => {
		setEditDictCode(undefined)
		setDrawerOpen(true)
	}
	
	const handleEdit = (dictCode: number | string) => {
		setEditDictCode(dictCode)
		setDrawerOpen(true)
	}
	
	const handleDrawerClose = () => {
		setDrawerOpen(false)
		setEditDictCode(undefined)
	}
	
	const handleDrawerSuccess = () => {
		setDrawerOpen(false)
		setEditDictCode(undefined)
		refreshAndDropCache()
	}
	
	const removeTag = useTagsViewStore((state) => state.removeView)
	
	const handleBack = () => {
		const fullPath = `${window.location.pathname}${window.location.search || ''}`
		removeTag(fullPath)
		void navigate({to: '/system/dict'})
	}
	
	// ---- 查询区域 ----
	const queryNode = (
		<Form form={form} layout="inline">
			<Form.Item name="dictLabel">
				<Input placeholder="字典标签" allowClear/>
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
		</>
	)
	
	// ---- 表格列 ----
	const columns: ColumnsType<DictDataVO> = [
		{title: '字典编码', dataIndex: 'dictCode', width: 100, ellipsis: true},
		{
			title: '字典标签',
			dataIndex: 'dictLabel',
			render: (label: string, record) => {
				const lc = record.listClass
				if (!lc || lc === 'default') return <span>{label}</span>
				const color = LIST_CLASS_COLOR[lc] ?? 'default'
				return <Tag color={color}>{label}</Tag>
			},
		},
		{title: '字典键值', dataIndex: 'dictValue', width: 100},
		{title: '排序', dataIndex: 'dictSort', width: 80},
		{title: '备注', dataIndex: 'remark', ellipsis: true},
		{title: '创建时间', dataIndex: 'createTime', width: 200},
		{
			title: '操作',
			key: 'action',
			width: 120,
			render: (_, record) => {
				const dictCode = record.dictCode
				if (dictCode === undefined) return null
				return (
					<Space size="small">
						<AuthButton type="link" size="small" permission="system:dict:edit"
						            onClick={() => handleEdit(dictCode)}>
							修改
						</AuthButton>
						<AuthButton type="link" size="small" danger permission="system:dict:remove"
						            onClick={() => handleDelete(dictCode)}>
							删除
						</AuthButton>
					</Space>
				)
			},
		},
	]
	
	const pageTitle = (
		<div className={styles.pageTitle}>
			<Button icon={<ArrowLeftOutlined/>} onClick={handleBack}>返回</Button>
			<span className={styles.pageTitleName}>{dictName}</span>
			<span className={styles.pageTitleType}>{dictType}</span>
		</div>
	)
	
	return (
		<Card title={pageTitle} className={styles.pageCard}>
			<BaseListPage<DictDataVO>
				rowKey="dictCode"
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
				storageKey="system-dict-data-columns"
			/>
			
			<DictDataDrawer
				open={drawerOpen}
				dictType={dictType}
				dictCode={editDictCode}
				onClose={handleDrawerClose}
				onSuccess={handleDrawerSuccess}
			/>
		</Card>
	)
}
