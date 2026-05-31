/** 通配符权限，拥有此标识即拥有全部按钮权限。 */
export const ALL_PERMISSION = '*:*:*'

/** 超级角色列表，拥有这些角色即拥有全部角色权限。 */
export const SUPER_ROLES = ['superadmin', 'admin'] as const

export type PermissionValue = string | string[]
export type RoleValue = string | string[]

function normalizeValue(value?: PermissionValue | RoleValue): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * 校验按钮权限。
 *
 * 规则：
 * - 用户权限中包含 `*:*:*` → 通过
 * - 用户权限中任意一项命中 required → 通过
 */
export function checkPermission(
  userPermissions: string[] = [],
  requiredPermissions?: PermissionValue,
): boolean {
  const required = normalizeValue(requiredPermissions)

  if (!required.length) {
    return false
  }

  return userPermissions.some((permission) => {
    return permission === ALL_PERMISSION || required.includes(permission)
  })
}

/**
 * 校验角色权限。
 *
 * 规则：
 * - 用户角色中包含 `superadmin` 或 `admin` → 通过
 * - 用户角色中任意一项命中 required → 通过
 */
export function checkRole(
  userRoles: string[] = [],
  requiredRoles?: RoleValue,
): boolean {
  const required = normalizeValue(requiredRoles)

  if (!required.length) {
    return false
  }

  return userRoles.some((role) => {
    return (SUPER_ROLES as readonly string[]).includes(role) || required.includes(role)
  })
}
