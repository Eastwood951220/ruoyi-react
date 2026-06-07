import { useCallback, useState } from 'react'
import { Button, Form, Input, message, Modal, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import DictTag from '@/components/DictTag'
import { useDict } from '@/hooks/useDict'
import { useTableList } from '@/hooks/useTableList'
import { unallocatedUserList, authUserSelectAll } from '@/api/system/role'
import type { RoleUserQuery } from '@/api/system/role/types'
import type { UserVO } from '@/api/system/user/types'

interface SelectUserModalProps {
	open: boolean
	roleId?: number | string
	onClose: () => void
	onSuccess: () => void
}

type SelectUserSearchForm = {
	userName?: string
	phonenumber?: string
}

type SelectUserListParams = Omit<RoleUserQuery, 'pageNum' | 'pageSize'>

export default function SelectUserModal(props: SelectUserModalProps) {
	const { open, roleId, onClose, onSuccess } = props
	const { sys_normal_disable } = useDict('sys_normal_disable')
	
	const [form] = Form.useForm<SelectUserSearchForm>()
	const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])
	const [submitting, setSubmitting] = useState(false)

	const buildQueryParams = useCallback((formValues: SelectUserSearchForm): SelectUserListParams => ({
		roleId: roleId ?? '',
		userName: formValues.userName ?? '',
		phonenumber: formValues.phonenumber ?? '',
	}), [roleId])

	const requestUnallocatedUsers = useCallback((params: RoleUserQuery) => {
		if (!params.roleId) {
			return Promise.resolve({ rows: [], total: 0 })
		}
		return unallocatedUserList(params)
	}, [])

	const {
		dataList,
		total,
		loading,
		pageNum,
		pageSize,
		search: handleSearch,
		reset: handleReset,
		changePage,
	} = useTableList<UserVO, SelectUserSearchForm, SelectUserListParams>({
		form,
		request: requestUnallocatedUsers,
		buildParams: buildQueryParams,
		immediate: false,
	})
	
	const handleOpenChange = (visible: boolean) => {
		if (!visible || !roleId) return
		setSelectedRowKeys([])
		handleReset({ roleId })
	}
	
	const handleConfirm = async () => {
		if (!roleId) return
		if (selectedRowKeys.length === 0) {
			message.warning('请选择要分配的用户')
			return
		}
		setSubmitting(true)
		try {
			await authUserSelectAll({
				roleId,
				userIds: selectedRowKeys,
			})
			message.success('分配成功')
			onSuccess()
		} finally {
			setSubmitting(false)
		}
	}
	
	const columns: ColumnsType<UserVO> = [
		{ title: '用户名称', dataIndex: 'userName', ellipsis: true },
		{ title: '用户昵称', dataIndex: 'nickName', ellipsis: true },
		{ title: '邮箱', dataIndex: 'email', ellipsis: true },
		{ title: '手机', dataIndex: 'phonenumber', ellipsis: true },
		{
			title: '状态',
			dataIndex: 'status',
			width: 80,
			align: 'center',
			render: (value: string) => <DictTag options={sys_normal_disable} value={value} />,
		},
		{ title: '创建时间', dataIndex: 'createTime', width: 160 },
	]
	
	return (
		<Modal
			title="选择用户"
			open={open}
			onCancel={onClose}
			onOk={handleConfirm}
			afterOpenChange={handleOpenChange}
			confirmLoading={submitting}
			width={800}
			destroyOnHidden
		>
			<Form form={form} layout="inline" style={{ marginBottom: 16 }}>
				<Form.Item name="userName">
					<Input placeholder="用户名称" allowClear />
				</Form.Item>
				<Form.Item name="phonenumber">
					<Input placeholder="手机号码" allowClear />
				</Form.Item>
				<Form.Item>
					<Space>
							<Button type="primary" onClick={() => handleSearch()}>
							搜索
						</Button>
							<Button onClick={() => handleReset()}>重置</Button>
					</Space>
				</Form.Item>
			</Form>
			
			<Table<UserVO>
				rowKey="userId"
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
				size="small"
				scroll={{ y: 260 }}
			/>
		</Modal>
	)
}
