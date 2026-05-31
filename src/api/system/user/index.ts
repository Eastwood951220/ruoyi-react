import request, { type ApiResponse } from '@/request'
import type { UserInfo } from './types'

/**
 * 获取当前登录用户的详细信息。
 *
 * 包含用户实体、角色列表和权限集合。
 * 通常在登录成功后、进入页面前调用，
 * 用于初始化用户状态和权限数据。
 */
export function getInfo(): Promise<ApiResponse<UserInfo>> {
  return request({
    url: '/system/user/getInfo',
    method: 'get',
  })
}

export type { LoginUser, UserInfo } from './types'
