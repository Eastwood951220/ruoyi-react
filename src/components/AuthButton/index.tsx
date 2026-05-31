import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import Auth from '@/components/Auth'
import type { AuthMode } from '@/components/Auth/types'
import type { PermissionValue, RoleValue } from '@/utils/permission'

export interface AuthButtonProps extends ButtonProps {
  /** 权限标识。 */
  permission?: PermissionValue

  /** 角色标识。使用 authRole 避免与 HTML role 属性冲突。 */
  authRole?: RoleValue

  /** 权限组合模式，默认 `'or'`。 */
  authMode?: AuthMode
}

export default function AuthButton(props: AuthButtonProps) {
  const {
    permission,
    authRole,
    authMode = 'or',
    children,
    ...buttonProps
  } = props

  return (
    <Auth permission={permission} role={authRole} mode={authMode}>
      <Button {...buttonProps}>{children}</Button>
    </Auth>
  )
}
