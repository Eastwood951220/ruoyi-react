import request, { type ApiResponse } from '@/request'
import type { MenuForm, MenuQuery, MenuVO, RouterVo } from './types'

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

/** 查询菜单列表 */
export function listMenu(query?: MenuQuery) {
  return request.get<ApiResponse<MenuVO[]>>('/system/menu/list', query)
}

/** 查询菜单详细 */
export function getMenu(menuId: number | string) {
  return request.get<ApiResponse<MenuVO>>(`/system/menu/${menuId}`)
}

/** 新增菜单 */
export function addMenu(data: MenuForm) {
  return request.post<ApiResponse<void>>('/system/menu', data)
}

/** 修改菜单 */
export function updateMenu(data: MenuForm) {
  return request.put<ApiResponse<void>>('/system/menu', data)
}

/** 删除菜单 */
export function delMenu(menuId: number | string) {
  return request.delete<ApiResponse<void>>(`/system/menu/${menuId}`)
}

/** 级联删除菜单 */
export function cascadeDelMenu(menuIds: Array<number | string>) {
  return request.delete<ApiResponse<void>>(`/system/menu/cascade/${menuIds}`)
}

export type { MenuForm, MenuQuery, MenuTreeOption, MenuType, MenuVO, RouterMeta, RouterVo } from './types'
