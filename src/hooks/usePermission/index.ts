import { useMemo } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { checkPermission, checkRole, type PermissionValue, type RoleValue } from '@/utils/permission'

export function usePermission() {
  const permissions = useAuthStore((state) => state.permissions || [])
  const roles = useAuthStore((state) => state.roles || [])

  return useMemo(() => {
    return {
      permissions,
      roles,
      hasPermi(requiredPermissions?: PermissionValue) {
        return checkPermission(permissions, requiredPermissions)
      },
      hasRole(requiredRoles?: RoleValue) {
        return checkRole(roles, requiredRoles)
      },
    }
  }, [permissions, roles])
}
