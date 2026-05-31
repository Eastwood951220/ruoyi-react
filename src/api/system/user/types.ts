/**
 * 登录用户基础信息。
 *
 * 对应后端 `LoginUser` 中嵌套的用户实体字段，
 * 通常来自 `sys_user` 表。
 */
export interface LoginUser {
  /** 用户主键 ID。 */
  userId?: number | string

  /** 登录账号（用户名）。 */
  userName?: string

  /** 用户昵称，用于界面展示。 */
  nickName?: string

  /** 头像地址（URL 或相对路径）。 */
  avatar?: string
}

/**
 * 当前登录用户的完整信息。
 *
 * 对应 RuoYi `/system/user/getInfo` 接口返回结构，
 * 包含用户实体、角色列表和权限集合。
 */
export interface UserInfo {
  /** 用户实体。部分接口直接在 data 下返回用户字段，此时 user 可能为空。 */
  user?: LoginUser

  /** 用户主键 ID（冗余字段，兼容不同后端返回格式）。 */
  userId?: number | string

  /** 登录账号（冗余字段）。 */
  userName?: string

  /** 用户昵称（冗余字段）。 */
  nickName?: string

  /** 头像地址（冗余字段）。 */
  avatar?: string

  /**
   * 角色标识列表。
   *
   * 例如 `['admin', 'common']`。
   * 前端根据角色判断是否渲染某些页面或按钮。
   * 为空时默认赋予 `['ROLE_DEFAULT']`。
   */
  roles: string[]

  /**
   * 权限标识列表。
   *
   * 例如 `['system:user:list', 'system:user:add']`。
   * 前端通过 `v-permission` 或 `hasPermission` 函数做细粒度按钮控制。
   */
  permissions: string[]
}

// ---- 用户管理模块 ----

import type { PostVO } from '@/api/system/post/types'
import type { RoleVO } from '@/api/system/role/types'

export type UserStatus = '0' | '1'

export interface UserVO {
  userId: number | string
  deptId?: number | string
  userName: string
  nickName?: string
  deptName?: string
  phonenumber?: string
  email?: string
  sex?: string
  status: UserStatus
  createTime?: string
  remark?: string
  roles?: RoleVO[]
}

export interface UserQuery {
  pageNum: number
  pageSize: number
  userName?: string
  nickName?: string
  phonenumber?: string
  status?: UserStatus | ''
  deptId?: number | string
  roleId?: number | string
  beginTime?: string
  endTime?: string
}

export interface UserForm {
  userId?: number | string
  deptId?: number | string | null
  userName?: string
  nickName?: string
  password?: string
  phonenumber?: string
  email?: string
  sex?: string
  status: UserStatus
  remark?: string
  postIds?: Array<number | string> | null
  roleIds?: Array<number | string> | null
}

/** getUser 接口返回结构，包含用户信息、岗位列表、角色列表 */
export interface UserData {
  user?: UserVO
  posts: PostVO[]
  roles: RoleVO[]
  postIds?: Array<number | string>
  roleIds?: Array<number | string>
}
