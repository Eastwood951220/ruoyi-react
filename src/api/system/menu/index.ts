import request, { type ApiResponse } from '@/request'
import type { RouterVo } from './types'

/**
 * 获取当前用户的路由菜单。
 *
 * 后端根据用户角色和权限过滤菜单，返回树形结构。
 * 前端拿到后递归转换为 React Router 路由配置。
 */
export function getRouters(): Promise<ApiResponse<RouterVo[]>> {
  return request({
    url: '/system/menu/getRouters',
    method: 'get',
  })
}

export type { RouterMeta, RouterVo } from './types'
