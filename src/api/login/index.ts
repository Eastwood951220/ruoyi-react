import request, { type ApiResponse } from '@/request'
import type {
  CaptchaImageResult,
  LoginParams,
  LoginResult,
  RegisterParams,
  TenantListResult,
} from './types'

const clientId = import.meta.env.VITE_APP_CLIENT_ID

/**
 * 账号密码登录。
 *
 * 自动注入 clientId 和 grantType，请求体经 AES+RSA 加密传输。
 */
export function login(data: LoginParams): Promise<ApiResponse<LoginResult>> {
  const params: LoginParams = {
    ...data,
    clientId: data.clientId || clientId,
    grantType: data.grantType || 'password',
  }

  return request({
    url: '/auth/login',
    method: 'post',
    data: params,
    isToken: false,
    isEncrypt: true,
    isRepeatSubmit: false,
  })
}

/**
 * 用户注册。
 *
 * 在登录参数基础上增加 confirmPassword，请求体加密传输。
 */
export function register(data: RegisterParams): Promise<ApiResponse<LoginResult>> {
  const params: RegisterParams = {
    ...data,
    clientId,
    grantType: 'password',
  }

  return request({
    url: '/auth/register',
    method: 'post',
    data: params,
    isToken: false,
    isEncrypt: true,
    isRepeatSubmit: false,
  })
}

/**
 * 退出登录。
 *
 * 后端清除 Token 和会话缓存。
 */
export function logout(): Promise<ApiResponse<void>> {
  return request({
    url: '/auth/logout',
    method: 'post',
  })
}

/**
 * 获取图形验证码。
 *
 * 返回 Base64 图片和 uuid，登录时需将两者一起回传。
 */
export function getCodeImg(): Promise<ApiResponse<CaptchaImageResult>> {
  return request({
    url: '/auth/code',
    method: 'get',
    isToken: false,
    timeout: 20000,
  })
}

/**
 * 第三方社交登录回调。
 *
 * grantType 固定为 `'social'`，由后端完成 OAuth2 授权码换 Token。
 */
export function callback(data: LoginParams): Promise<ApiResponse<LoginResult>> {
  const params: LoginParams = {
    ...data,
    clientId,
    grantType: 'social',
  }

  return request({
    url: '/auth/social/callback',
    method: 'post',
    data: params,
  })
}

/**
 * 获取租户列表。
 *
 * 多租户模式下登录页展示租户选择器时调用。
 * @param isToken - 是否需要 Token 鉴权，默认 false（未登录即可调用）
 */
export function getTenantList(
  isToken = false,
): Promise<ApiResponse<TenantListResult>> {
  return request({
    url: '/auth/tenant/list',
    method: 'get',
    isToken,
  })
}

export type {
  CaptchaImageResult,
  LoginParams,
  LoginResult,
  RegisterParams,
  TenantItem,
  TenantListResult,
} from './types'

// 以下类型已迁移至对应模块，此处重新导出以保持向后兼容
export type { LoginUser, UserInfo } from '@/api/system/user/types'
export type { RouterMeta, RouterVo } from '@/api/system/menu/types'
