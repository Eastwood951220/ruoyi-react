import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Col, Form, Input, InputNumber, message, Radio, Row} from 'antd'
import type {DataNode} from 'antd/es/tree'
import BaseDrawer from '@/components/BaseDrawer'
import {addRole, getRole, menuTreeselect, roleMenuTreeselect, updateRole} from '@/api/system/role'
import type {MenuTreeOption, RoleForm} from '@/api/system/role/types'
import type {DictOption} from '@/store/useDictStore'
import VirtualCheckTree from './VirtualCheckTree'

interface RoleDrawerProps {
	open: boolean
	roleId?: number | string
	statusOptions: DictOption[]
	onClose: () => void
	onSuccess: () => void
}

function convertMenuTree(nodes: MenuTreeOption[]): DataNode[] {
	return nodes.map((node) => ({
		key: node.id,
		title: node.label,
		disabled: node.disabled,
		children: node.children ? convertMenuTree(node.children) : undefined,
	}))
}

export default function RoleDrawer(props: RoleDrawerProps) {
	const {open, roleId, statusOptions, onClose, onSuccess} = props

	const [form] = Form.useForm<RoleForm>()
	const [roleLoading, setRoleLoading] = useState(false)
	const [treeLoading, setTreeLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [menuTreeData, setMenuTreeData] = useState<DataNode[]>([])
	const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([])
	const [halfCheckedKeys, setHalfCheckedKeys] = useState<React.Key[]>([])
	const [menuTreeVersion, setMenuTreeVersion] = useState(0)
	const fetchedRef = useRef(false)

	const isEdit = roleId !== undefined

	const fetchData = useCallback(() => {
		if (isEdit && roleId !== undefined) {
			setRoleLoading(true)
			setTreeLoading(true)
			Promise.all([getRole(roleId), roleMenuTreeselect(roleId)])
				.then(([roleRes, menuRes]) => {
					const roleData = roleRes.data
					if (roleData) {
						form.setFieldsValue({
							roleId: roleData.roleId,
							roleName: roleData.roleName,
							roleKey: roleData.roleKey,
							roleSort: Number(roleData.roleSort ?? 0),
							status: roleData.status ?? '0',
							remark: roleData.remark ?? '',
						})
					}
					const menus = menuRes?.data?.menus ?? []
					const checked = menuRes?.data?.checkedKeys ?? []

					setMenuTreeData(convertMenuTree(menus))
					setCheckedKeys(checked)

					setMenuTreeVersion((version) => version + 1)
				})
				.finally(() => {
					setRoleLoading(false)
					setTreeLoading(false)
				})
		} else {
			setRoleLoading(false)
			form.setFieldsValue({roleSort: 1, status: '0', menuCheckStrictly: true})
			setTreeLoading(true)
			menuTreeselect()
				.then((res) => {
					setMenuTreeData(convertMenuTree(res.menus ?? []))
					setCheckedKeys([])
					setMenuTreeVersion((version) => version + 1)
				})
				.finally(() => setTreeLoading(false))
		}
	}, [isEdit, roleId, form])

	useEffect(() => {
		if (!open) return
		if (fetchedRef.current) return
		fetchedRef.current = true
		fetchData()
	}, [open, fetchData])

	const handleClose = () => {
		fetchedRef.current = false
		form.resetFields()
		setMenuTreeData([])
		setCheckedKeys([])
		setHalfCheckedKeys([])
		setMenuTreeVersion((version) => version + 1)
		onClose()
	}

	const handleConfirm = async () => {
		if (roleLoading || treeLoading) return

		const values = await form.validateFields()
		setSubmitting(true)

		try {
			// 合并选中和半选中的节点
			const allMenuIds = [...checkedKeys, ...halfCheckedKeys] as Array<number | string>
			const submitData: RoleForm = {
				...values,
				menuIds: allMenuIds,
				menuCheckStrictly: form.getFieldValue('menuCheckStrictly') ?? true,
			}

			if (isEdit) {
				await updateRole({...submitData, roleId})
				message.success('修改成功')
			} else {
				await addRole(submitData)
				message.success('新增成功')
			}
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

	const rules = {
		roleName: [{required: true, message: '角色名称不能为空', trigger: 'blur'}],
		roleKey: [{required: true, message: '权限字符不能为空', trigger: 'blur'}],
		roleSort: [{required: true, message: '角色顺序不能为空', trigger: 'blur'}],
	}

	return (
		<BaseDrawer
			open={open}
			title={isEdit ? '修改角色' : '添加角色'}
			width={600}
			loading={roleLoading}
			confirmLoading={submitting || roleLoading || treeLoading}
			onClose={handleClose}
			onConfirm={handleConfirm}
		>
			<Form form={form} layout="vertical" autoComplete="off">
				<Row gutter={16}>
					<Col span={24}>
						<Form.Item name="roleName" label="角色名称" rules={rules.roleName}>
							<Input placeholder="请输入角色名称"/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name="roleKey" label="权限字符" rules={rules.roleKey}
						           tooltip="控制器中定义的权限字符，如：@SaCheckRole('admin')">
							<Input placeholder="请输入权限字符"/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name="roleSort" label="角色顺序" rules={rules.roleSort}>
							<InputNumber min={0} className="w-full"/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name="status" label="状态">
							<Radio.Group>
								{statusOptions.map((opt) => (
									<Radio key={opt.value} value={opt.value}>
										{opt.label}
									</Radio>
								))}
							</Radio.Group>
						</Form.Item>
					</Col>
					<Col span={24}>
						<Form.Item label="菜单权限">
							<VirtualCheckTree
								key={menuTreeVersion}
								treeData={menuTreeData}
								checkedKeys={checkedKeys}
								halfCheckedKeys={halfCheckedKeys}
								loading={treeLoading}
								height={300}
								onCheck={handleTreeCheck}
							/>
						</Form.Item>
					</Col>
					<Col span={24}>
						<Form.Item name="remark" label="备注">
							<Input.TextArea rows={3} placeholder="请输入备注"/>
						</Form.Item>
					</Col>
				</Row>
			</Form>
		</BaseDrawer>
	)
}
