import { usePermission } from '@/hooks/usePermission'
import type { AuthProps } from './types'

export default function Auth(props: AuthProps) {
  const {
    permission,
    role,
    mode = 'or',
    fallback = null,
    children,
  } = props

  const { hasPermi, hasRole } = usePermission()

  const hasPermissionRule = Boolean(permission)
  const hasRoleRule = Boolean(role)

  // 既没有传 permission 也没有传 role，不展示
  if (!hasPermissionRule && !hasRoleRule) {
    return <>{fallback}</>
  }

  const permissionPassed = hasPermissionRule ? hasPermi(permission) : false
  const rolePassed = hasRoleRule ? hasRole(role) : false

  const passed =
    mode === 'and'
      ? (!hasPermissionRule || permissionPassed) && (!hasRoleRule || rolePassed)
      : permissionPassed || rolePassed

  if (!passed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export type { AuthProps } from './types'
