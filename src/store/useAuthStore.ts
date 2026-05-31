import {create} from 'zustand'
import {devtools, persist} from 'zustand/middleware'
import {getInfo, type LoginUser, type UserInfo as UserInfoResponse,} from '@/api/system/user'
import {usePermissionStore} from '@/store/usePermissionStore'
import {useTagsViewStore} from '@/store/useTagsViewStore'
import {getToken, removeToken, setToken} from '@/utils/auth'

type UserInfo = {
	userId?: number | string
	username: string
	displayName: string
	avatar?: string
}

type AuthState = {
	token: string
	userInfo: UserInfo | null
	roles: string[]
	permissions: string[]
	isAuthenticated: boolean
	hasUserInfo: boolean
	setLoginState: (token: string, userInfo?: UserInfo | null) => void
	setUserInfo: (info: UserInfoResponse) => void
	loadUserInfo: () => Promise<UserInfoResponse>
	logout: () => void
}

function normalizeUserInfo(info: UserInfoResponse): UserInfo {
	const user = info.user ?? info
	const loginUser = user as LoginUser
	const username = loginUser.userName ?? info.userName ?? ''
	const displayName = loginUser.nickName ?? info.nickName ?? username
	
	return {
		userId: loginUser.userId ?? info.userId,
		username,
		displayName,
		avatar: loginUser.avatar ?? info.avatar,
	}
}

export const useAuthStore = create<AuthState>()(
	devtools(
		persist(
			(set) => ({
				token: getToken() ?? '',
				userInfo: null,
				roles: [],
				permissions: [],
				isAuthenticated: Boolean(getToken()),
				hasUserInfo: false,
				setLoginState: (token, userInfo) => {
					setToken(token)
					set({
						token,
						userInfo: userInfo ?? null,
						roles: [],
						permissions: [],
						isAuthenticated: true,
						hasUserInfo: Boolean(userInfo),
					})
				},
				setUserInfo: (info) => {
					set({
						userInfo: normalizeUserInfo(info),
						roles: info.roles?.length ? info.roles : ['ROLE_DEFAULT'],
						permissions: info.permissions ?? [],
						hasUserInfo: true,
					})
				},
				loadUserInfo: async () => {
					const response = await getInfo()
					const info = response.data
					
					if (!info) {
						throw new Error('获取用户信息接口未返回 data')
					}
					
					useAuthStore.getState().setUserInfo(info)
					return info
				},
				logout: () => {
					removeToken()
					usePermissionStore.getState().resetRoutes()
					useTagsViewStore.getState().resetViews()
					set({
						token: '',
						userInfo: null,
						roles: [],
						permissions: [],
						isAuthenticated: false,
						hasUserInfo: false,
					})
				},
			}),
			{
				name: 'ruoyi-react-auth',
				partialize: (state) => ({
					token: state.token,
					isAuthenticated: state.isAuthenticated,
				}),
			},
		),
	),
)
