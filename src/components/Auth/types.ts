import type { ReactNode } from 'react'
import type { PermissionValue, RoleValue } from '@/utils/permission'

export type AuthMode = 'and' | 'or'

export interface AuthProps {
  /** 权限标识，单个字符串或字符串数组。 */
  permission?: PermissionValue

  /** 角色标识，单个字符串或字符串数组。 */
  role?: RoleValue

  /**
   * 多条件组合模式。
   * - `'or'`：权限或角色任意一个通过即可（默认）
   * - `'and'`：权限条件和角色条件都必须通过
   */
  mode?: AuthMode

  /** 未通过时展示的降级内容。 */
  fallback?: ReactNode

  /** 子元素。 */
  children: ReactNode
}
