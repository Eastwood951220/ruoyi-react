import React, {useCallback, useRef, useState} from 'react'
import {Form, Input, message, Select} from 'antd'
import type {DataNode} from 'antd/es/tree'
import BaseDrawer from '@/components/BaseDrawer'
import {dataScope, deptTreeSelect, getRole} from '@/api/system/role'
import type {DeptTreeOption, RoleForm} from '@/api/system/role/types'
import VirtualCheckTree from './VirtualCheckTree'

interface DataScopeDrawerProps {
	open: boolean
	roleId?: number | string
	onClose: () => void
	onSuccess: () => void
}

const DATA_SCOPE_OPTIONS = [
	{value: '1', label: '全部数据权限'},
	{value: '2', label: '自定数据权限'},
	{value: '3', label: '本部门数据权限'},
	{value: '4', label: '本部门及以下数据权限'},
	{value: '5', label: '仅本人数据权限'},
	{value: '6', label: '部门及以下或本人数据权限'},
]

function convertDeptTree(nodes: DeptTreeOption[]): DataNode[] {
	return nodes.map((node) => ({
		key: node.id,
		title: node.label,
		disabled: node.disabled,
		children: node.children ? convertDeptTree(node.children) : undefined,
	}))
}

export default function DataScopeDrawer(props: DataScopeDrawerProps) {
	const {open, roleId, onClose, onSuccess} = props

	const [form] = Form.useForm<RoleForm>()
	const [submitting, setSubmitting] = useState(false)
	const [treeLoading, setTreeLoading] = useState(false)
	const [deptTreeData, setDeptTreeData] = useState<DataNode[]>([])
	const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([])
	const [halfCheckedKeys, setHalfCheckedKeys] = useState<React.Key[]>([])
	const [currentDataScope, setCurrentDataScope] = useState('1')
	const [deptCheckStrictly, setDeptCheckStrictly] = useState(true)
	const [roleName, setRoleName] = useState('')
	const [roleKey, setRoleKey] = useState('')
	const [deptTreeVersion, setDeptTreeVersion] = useState(0)
	const fetchedRef = useRef(false)

	const handleAfterOpenChange = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) return
			if (fetchedRef.current) return
			if (roleId === undefined) return

			fetchedRef.current = true
			setTreeLoading(true)

			Promise.all([getRole(roleId), deptTreeSelect(roleId)])
				.then(([roleRes, deptRes]) => {
					const roleData = roleRes.data
					const nextDataScope = roleData?.dataScope ?? '1'
					const nextDeptCheckStrictly = roleData?.deptCheckStrictly ?? true

					if (roleData) {
						form.setFieldsValue({
							roleId: roleData.roleId,
							dataScope: nextDataScope,
							deptCheckStrictly: nextDeptCheckStrictly,
						})
						setRoleName(roleData.roleName ?? '')
						setRoleKey(roleData.roleKey ?? '')
					}

					setCurrentDataScope(nextDataScope)
					setDeptCheckStrictly(nextDeptCheckStrictly)
					setDeptTreeData(convertDeptTree(deptRes?.data?.depts ?? []))
					setCheckedKeys(deptRes?.data?.checkedKeys ?? [])
					setDeptTreeVersion((version) => version + 1)
				})
				.finally(() => setTreeLoading(false))
		},
		[roleId, form],
	)

	const handleClose = () => {
		fetchedRef.current = false
		form.resetFields()
		setDeptTreeData([])
		setCheckedKeys([])
		setHalfCheckedKeys([])
		setCurrentDataScope('1')
		setDeptCheckStrictly(true)
		setRoleName('')
		setRoleKey('')
		setDeptTreeVersion((version) => version + 1)
		onClose()
	}

	const handleConfirm = async () => {
		const values = await form.validateFields()
		setSubmitting(true)

		try {
			const allDeptIds = currentDataScope === '2'
				? ([...checkedKeys, ...halfCheckedKeys] as Array<number | string>)
				: []
			const submitData: RoleForm = {
				roleId,
				dataScope: values.dataScope,
				deptIds: allDeptIds,
			}
			await dataScope(submitData)
			message.success('修改成功')
			form.resetFields()
			fetchedRef.current = false
			onSuccess()
		} finally {
			setSubmitting(false)
		}
	}

	const handleTreeCheck = useCallback((newChecked: React.Key[], newHalf: React.Key[]) => {
		setCheckedKeys(newChecked)
		setHalfCheckedKeys(newHalf)
	}, [])
	

	return (
		<BaseDrawer
			open={open}
			title="分配数据权限"
			width={520}
			loading={false}
			confirmLoading={submitting}
			onClose={handleClose}
			onConfirm={handleConfirm}
			afterOpenChange={handleAfterOpenChange}
		>
			<Form form={form} layout="vertical" autoComplete="off">
				<Form.Item label="角色名称">
					<Input value={roleName} disabled/>
				</Form.Item>
				<Form.Item label="权限字符">
					<Input value={roleKey} disabled/>
				</Form.Item>
				<Form.Item name="dataScope" label="权限范围">
					<Select
						options={DATA_SCOPE_OPTIONS}
						onChange={(value: string) => setCurrentDataScope(value)}
					/>
				</Form.Item>
				{currentDataScope === '2' && (
					<Form.Item label="数据权限">
						<VirtualCheckTree
							key={deptTreeVersion}
							treeData={deptTreeData}
							checkedKeys={checkedKeys}
							halfCheckedKeys={halfCheckedKeys}
							loading={treeLoading}
							defaultCheckStrictly={deptCheckStrictly}
							height={300}
							onCheck={handleTreeCheck}
						/>
					</Form.Item>
				)}
			</Form>
		</BaseDrawer>
	)
}
