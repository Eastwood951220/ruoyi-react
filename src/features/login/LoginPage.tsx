import {useCallback, useEffect, useState} from 'react'
import {ApartmentOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined,} from '@ant-design/icons'
import {useNavigate} from '@tanstack/react-router'
import {Button, Checkbox, Form, Input, message, Select, Typography} from 'antd'
import Cookies from 'js-cookie'
import {
	type CaptchaImageResult,
	getCodeImg,
	getTenantList,
	login,
	type LoginParams,
	type TenantItem,
	type TenantListResult,
} from '@/api/login'
import {ThemeModeToggle} from '@/components/ThemeModeToggle'
import {useAuthStore} from '@/store/useAuthStore'
import {cn} from '@/utils/cn'
import styles from './LoginPage.module.less'

type LoginFormValues = LoginParams & {
	rememberMe?: boolean
}

const DEFAULT_TENANT_ID = '000000'
const REMEMBER_TENANT_KEY = 'tenantId'
const REMEMBER_USERNAME_KEY = 'username'
const REMEMBER_PASSWORD_KEY = 'password'
const REMEMBER_ME_KEY = 'rememberMe'

const initialValues: LoginFormValues = {
	tenantId: DEFAULT_TENANT_ID,
	username: 'admin',
	password: 'admin123',
	rememberMe: false,
	code: '',
	uuid: '',
}

const defaultTenant: TenantItem = {
	companyName: '默认租户',
	tenantId: DEFAULT_TENANT_ID,
}

function getCaptchaMimeType(img: string): string {
	if (img.startsWith('/9j/')) {
		return 'image/jpeg'
	}
	
	if (img.startsWith('iVBOR')) {
		return 'image/png'
	}
	
	return 'image/gif'
}

function encodePassword(password: string): string {
	return window.btoa(encodeURIComponent(password))
}

function decodePassword(password: string): string {
	try {
		return decodeURIComponent(window.atob(password))
	} catch {
		return password
	}
}

export function LoginPage() {
	const [form] = Form.useForm<LoginFormValues>()
	const navigate = useNavigate({from: '/login'})
	const setLoginState = useAuthStore((state) => state.setLoginState)
	const [captchaEnabled, setCaptchaEnabled] = useState(true)
	const [codeUrl, setCodeUrl] = useState('')
	const [loading, setLoading] = useState(false)
	const [tenantEnabled, setTenantEnabled] = useState(true)
	const [tenantList, setTenantList] = useState<TenantItem[]>([])
	
	const applyCaptcha = useCallback((res: CaptchaImageResult) => {
		const enabled = res.captchaEnabled ?? true

		setCaptchaEnabled(enabled)
		if (enabled) {
			setCodeUrl(res.img ? `data:${getCaptchaMimeType(res.img)};base64,${res.img}` : '')
			form.setFieldValue('uuid', res.uuid ?? '')
		}
	}, [form])

	const getCode = useCallback(async () => {
		const response = await getCodeImg()
		const res: CaptchaImageResult = response.data ?? {}

		applyCaptcha(res)
	}, [applyCaptcha])

	const applyTenantList = useCallback((res: TenantListResult) => {
		const enabled = res.tenantEnabled ?? true
		const list = res.voList?.length ? res.voList : [defaultTenant]

		setTenantEnabled(enabled)
		setTenantList(list)

		if (enabled && list.length > 0) {
			const rememberedTenantId = Cookies.get(REMEMBER_TENANT_KEY)
			const nextTenantId =
				rememberedTenantId &&
				list.some((tenant) => tenant.tenantId === rememberedTenantId)
					? rememberedTenantId
					: list[0].tenantId

			form.setFieldValue('tenantId', nextTenantId)
		}
	}, [form])

	useEffect(() => {
		const tenantId = Cookies.get(REMEMBER_TENANT_KEY)
		const username = Cookies.get(REMEMBER_USERNAME_KEY)
		const password = Cookies.get(REMEMBER_PASSWORD_KEY)
		const rememberMe = Cookies.get(REMEMBER_ME_KEY)

		form.setFieldsValue({
			tenantId: tenantId ?? initialValues.tenantId,
			username: username ?? initialValues.username,
			password: password ? decodePassword(password) : initialValues.password,
			rememberMe: rememberMe === 'true',
		})

		let active = true

		void getTenantList()
			.then((response) => {
				if (active) {
					applyTenantList(response.data ?? {})
				}
			})
			.catch(() => {
				if (active) {
					setTenantEnabled(true)
					setTenantList([defaultTenant])
					form.setFieldValue(
						'tenantId',
						Cookies.get(REMEMBER_TENANT_KEY) ?? DEFAULT_TENANT_ID,
					)
				}
			})
		void getCodeImg().then((response) => {
			if (active) {
				applyCaptcha(response.data ?? {})
			}
		})

		return () => {
			active = false
		}
	}, [applyCaptcha, applyTenantList, form])
	
	const handleFinish = async (values: LoginFormValues) => {
		setLoading(true)
		
		try {
			if (values.rememberMe) {
				Cookies.set(REMEMBER_TENANT_KEY, values.tenantId ?? DEFAULT_TENANT_ID, {
					expires: 30,
				})
				Cookies.set(REMEMBER_USERNAME_KEY, values.username, {expires: 30})
				Cookies.set(REMEMBER_PASSWORD_KEY, encodePassword(values.password), {
					expires: 30,
				})
				Cookies.set(REMEMBER_ME_KEY, 'true', {expires: 30})
			} else {
				Cookies.remove(REMEMBER_USERNAME_KEY)
				Cookies.remove(REMEMBER_PASSWORD_KEY)
				Cookies.remove(REMEMBER_ME_KEY)
				Cookies.remove(REMEMBER_TENANT_KEY)
			}
			
			const loginParams: LoginParams = {
				tenantId: values.tenantId,
				username: values.username,
				password: values.password,
				code: values.code,
				uuid: values.uuid,
			}
			const res = await login(loginParams)
			const token = res.data?.access_token
			
			if (!token) {
				throw new Error('登录接口未返回 access_token')
			}
			
			setLoginState(token)
			message.success('登录成功')
			
			const searchParams = new URLSearchParams(window.location.search)
			const redirect = searchParams.get('redirect')
			
			void navigate({to: redirect || '/', replace: true})
		} catch {
			if (captchaEnabled) {
				void getCode()
			}
		} finally {
			setLoading(false)
		}
	}
	
	return (
		<main className={cn(styles.loginPage, 'relative min-h-screen overflow-hidden')}>
			<ThemeModeToggle
				className={styles.themeToggle}
				size="middle"
				variant="login"
			/>
			
			<section className={styles.loginPanel}>
				<div className={styles.titleBox}>
					<div className={styles.logoMark}>RA</div>
					<div>
						<Typography.Title className={styles.loginPanelTitle} level={2}>
							React Admin
						</Typography.Title>
						<Typography.Text className={styles.loginPanelSubtitle}>
							多租户后台管理平台
						</Typography.Text>
					</div>
				</div>
				
				<Form<LoginFormValues>
					form={form}
					layout="vertical"
					initialValues={initialValues}
					onFinish={handleFinish}
					autoComplete="off"
					className={styles.loginForm}
				>
					{tenantEnabled ? (
						<Form.Item
							name="tenantId"
							rules={[{required: true, message: '请选择租户'}]}
						>
							<Select
								allowClear={false}
								showSearch={{ optionFilterProp: 'label' }}
								options={tenantList.map((tenant) => ({
									label: tenant.companyName,
									value: tenant.tenantId,
								}))}
								placeholder="请选择租户"
								prefix={<ApartmentOutlined/>}
								size="large"
							/>
						</Form.Item>
					) : null}
					
					<Form.Item
						name="username"
						rules={[{required: true, message: '请输入您的账号'}]}
					>
						<Input
							autoComplete="off"
							prefix={<UserOutlined/>}
							size="large"
							placeholder="账号"
						/>
					</Form.Item>
					
					<Form.Item
						name="password"
						rules={[{required: true, message: '请输入您的密码'}]}
					>
						<Input.Password
							autoComplete="off"
							prefix={<LockOutlined/>}
							size="large"
							placeholder="密码"
						/>
					</Form.Item>
					
					{captchaEnabled ? (
						<div className={styles.codeRow}>
							<Form.Item
								className={styles.codeItem}
								name="code"
								rules={[{required: true, message: '请输入验证码'}]}
							>
								<Input
									autoComplete="off"
									prefix={<SafetyCertificateOutlined/>}
									size="large"
									placeholder="验证码"
								/>
							</Form.Item>
							<button
								className={styles.codeButton}
								type="button"
								onClick={() => void getCode()}
								aria-label="刷新验证码"
							>
								{codeUrl ? (
									<img src={codeUrl} alt="验证码"/>
								) : (
									<span>刷新验证码</span>
								)}
							</button>
						</div>
					) : null}
					
					<Form.Item name="rememberMe" valuePropName="checked">
						<Checkbox>记住密码</Checkbox>
					</Form.Item>
					
					<Form.Item name="uuid" hidden>
						<Input/>
					</Form.Item>
					
					<Button
						type="primary"
						htmlType="submit"
						size="large"
						loading={loading}
						block
					>
						{loading ? '登 录 中...' : '登 录'}
					</Button>
				</Form>
			</section>
			
			<footer className={styles.loginFooter}>
				<Typography.Text>Copyright © 2026 React Admin All Rights Reserved.</Typography.Text>
			</footer>
		</main>
	)
}
