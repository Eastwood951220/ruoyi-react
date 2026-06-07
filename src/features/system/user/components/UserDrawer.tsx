import {useCallback, useRef, useState} from 'react'
import {Col, Form, Input, message, Radio, Row, Select, TreeSelect} from 'antd'
import BaseDrawer from '@/components/BaseDrawer'
import {addUser, getUser, updateUser} from '@/api/system/user'
import type {UserForm} from '@/api/system/user/types'
import type {DeptTreeNode} from '@/api/system/dept/types'
import type {PostVO} from '@/api/system/post/types'
import type {RoleVO} from '@/api/system/role/types'
import type {DictOption} from '@/store/useDictStore'
import {optionselect} from '@/api/system/post'

interface UserDrawerProps {
	open: boolean
	userId?: number | string
	deptTree: DeptTreeNode[]
	sexOptions: DictOption[]
	statusOptions: DictOption[]
	currentUserId?: number | string
	initPassword: string
	onClose: () => void
	onSuccess: () => void
}

const PASSWORD_PATTERN = /^[^<>"'|\\]+$/
const PHONE_PATTERN = /^1[3456789][0-9]\d{8}$/

function convertDeptTree(nodes: DeptTreeNode[]): Record<string, unknown>[] {
	return nodes.map((node) => ({
		value: node.id,
		title: node.label,
		disabled: node.disabled,
		children: node.children ? convertDeptTree(node.children) : undefined,
	}))
}

export default function UserDrawer(props: UserDrawerProps) {
	const {
		open,
		userId,
		deptTree,
		sexOptions,
		statusOptions,
		currentUserId,
		initPassword,
		onClose,
		onSuccess,
	} = props
	
	const [form] = Form.useForm<UserForm>()
	const [loading, setLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [postOptions, setPostOptions] = useState<PostVO[]>([])
	const [roleOptions, setRoleOptions] = useState<RoleVO[]>([])
	const fetchedRef = useRef(false)
	
	const isEdit = userId !== undefined
	const isSelfEdit = isEdit && userId === currentUserId
	
	const deptTreeData = convertDeptTree(deptTree)
	
	const postSelectOptions = postOptions.map((post) => ({
		value: post.postId,
		label: post.postName,
	}))
	
	const roleSelectOptions = roleOptions.map((role) => ({
		value: role.roleId,
		label: role.roleName,
	}))
	
	const handleAfterOpenChange = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) return
			if (fetchedRef.current) return
			fetchedRef.current = true
			
			if (isEdit && userId !== undefined) {
				setLoading(true)
				getUser(userId)
					.then((res) => {
						const data = res.data
						if (data) {
							setPostOptions(data.posts ?? [])
							// 合并角色：接口返回的全部角色 + 用户已有的角色（去重）
							const allRoles = data.roles ?? []
							const userRoles = data.user?.roles ?? []
							const roleMap = new Map<number | string, RoleVO>()
							for (const role of allRoles) {
								roleMap.set(role.roleId, role)
							}
							for (const role of userRoles) {
								if (!roleMap.has(role.roleId)) {
									roleMap.set(role.roleId, role)
								}
							}
							setRoleOptions(Array.from(roleMap.values()))
							
							const user = data.user
							if (user) {
								form.setFieldsValue({
									userId: user.userId,
									deptId: user.deptId,
									userName: user.userName,
									nickName: user.nickName,
									phonenumber: user.phonenumber,
									email: user.email,
									sex: user.sex,
									status: user.status,
									remark: user.remark ?? '',
									postIds: data.postIds ?? [],
									roleIds: data.roleIds ?? [],
								})
							}
						}
					})
					.finally(() => setLoading(false))
			} else {
				// 新增时获取岗位和角色选项
				getUser()
					.then((res) => {
						const data = res.data
						if (data) {
							setPostOptions(data.posts ?? [])
							setRoleOptions(data.roles ?? [])
						}
					})
					.catch(() => {
						// ignore
					})
				form.setFieldsValue({
					password: initPassword,
					status: '0',
				})
			}
		},
		[isEdit, userId, form, initPassword],
	)
	
	const handleClose = () => {
		fetchedRef.current = false
		form.resetFields()
		onClose()
	}
	
	const handleConfirm = async () => {
		const values = await form.validateFields()
		setSubmitting(true)
		
		try {
			if (isEdit) {
				const submitData = {...values, userId}
				// 自我编辑保护：清空 deptId、postIds、roleIds
				if (isSelfEdit) {
					submitData.deptId = null
					submitData.postIds = null
					submitData.roleIds = null
				}
				await updateUser(submitData)
				message.success('修改成功')
			} else {
				await addUser(values)
				message.success('新增成功')
			}
			form.resetFields()
			fetchedRef.current = false
			onSuccess()
		} finally {
			setSubmitting(false)
		}
	}
	
	const handleDeptChange = (value: number | string) => {
		optionselect(value).then((res) => {
			setPostOptions(res.data ?? [])
		})
		form.setFieldsValue({postIds: []})
	}
	
	// 表单校验规则
	const rules = {
		userName: [
			{required: true, message: '用户名称不能为空'},
			{min: 2, max: 20, message: '用户名称长度必须介于 2 到 20 个字符'},
		],
		nickName: [
			{required: true, message: '用户昵称不能为空'},
		],
		password: [
			{required: true, message: '用户密码不能为空'},
			{min: 5, max: 20, message: '用户密码长度必须介于 5 到 20 个字符'},
			{
				pattern: PASSWORD_PATTERN,
				message: '用户密码不能包含 < > " \' \\ | 等特殊字符',
				
			},
		],
		email: [
			{type: 'email' as const, message: '请输入正确的邮箱地址'},
		],
		phonenumber: [
			{pattern: PHONE_PATTERN, message: '请输入正确的手机号码'},
		],
		roleIds: [
			{required: true, message: '用户角色不能为空'},
		],
	}
	
	return (
		<BaseDrawer
			open={open}
			title={isEdit ? '修改用户' : '新增用户'}
			width={640}
			loading={loading}
			confirmLoading={submitting}
			onClose={handleClose}
			onConfirm={handleConfirm}
			afterOpenChange={handleAfterOpenChange}
		>
			<Form form={form} layout="vertical" autoComplete="off">
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item name="nickName" label="用户昵称" rules={rules.nickName}>
							<Input placeholder="请输入用户昵称"/>
						</Form.Item>
					</Col>
					{!isSelfEdit && (
						<Col span={12}>
							<Form.Item name="deptId" label="归属部门">
								<TreeSelect
									placeholder="请选择归属部门"
									treeData={deptTreeData}
									allowClear
									treeDefaultExpandAll
									onChange={handleDeptChange}
								/>
							</Form.Item>
						</Col>
					)}
					<Col span={12}>
						<Form.Item name="phonenumber" label="手机号码" rules={rules.phonenumber}>
							<Input placeholder="请输入手机号码" maxLength={11}/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name="email" label="邮箱" rules={rules.email}>
							<Input placeholder="请输入邮箱"/>
						</Form.Item>
					</Col>
					{!isEdit && (
						<>
							<Col span={12}>
								<Form.Item name="userName" label="用户名称" rules={rules.userName}>
									<Input placeholder="请输入用户名称"/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item name="password" label="用户密码" rules={rules.password}>
									<Input.Password placeholder="请输入用户密码"/>
								</Form.Item>
							</Col>
						</>
					)}
					<Col span={12}>
						<Form.Item name="sex" label="用户性别">
							<Select
								placeholder="请选择性别"
								allowClear
								options={sexOptions.map((opt) => ({value: opt.value, label: opt.label}))}
							/>
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
					{!isSelfEdit && (
						<>
							<Col span={12}>
								<Form.Item name="postIds" label="岗位">
									<Select
										mode="multiple"
										placeholder="请选择岗位"
										allowClear
										options={postSelectOptions}
									/>
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item name="roleIds" label="角色" rules={rules.roleIds}>
									<Select
										mode="multiple"
										placeholder="请选择角色"
										allowClear
										options={roleSelectOptions}
									/>
								</Form.Item>
							</Col>
						</>
					)}
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
