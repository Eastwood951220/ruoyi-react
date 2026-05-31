import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'
import { usePermissionStore } from '@/store/usePermissionStore'

type GuardContext = {
  location: {
    href: string
  }
}

/** 单例 Promise，防止并发请求重复加载用户信息和路由。 */
let preloadPromise: Promise<void> | null = null

/**
 * 预加载用户信息和动态路由。
 *
 * 使用单例 Promise 保证同一时刻只有一组请求在进行，
 * 多个路由守卫同时触发时不会重复调用接口。
 */
async function preloadAuthResources(): Promise<void> {
  const authStore = useAuthStore.getState()
  const permissionStore = usePermissionStore.getState()

  if (authStore.hasUserInfo && permissionStore.isRoutesLoaded) {
    return
  }

  preloadPromise ??= Promise.all([
    authStore.hasUserInfo ? Promise.resolve() : authStore.loadUserInfo(),
    permissionStore.isRoutesLoaded ? Promise.resolve() : permissionStore.loadRoutes(),
  ])
    .then(() => undefined)
    .finally(() => {
      preloadPromise = null
    })

  await preloadPromise
}

function redirectToLogin(locationHref: string): never {
  throw redirect({
    to: '/login',
    search: { redirect: locationHref } as never,
    replace: true,
  })
}

/**
 * 路由前置守卫：要求已认证。
 *
 * 1. 未登录 → 重定向到 /login
 * 2. 已登录 → 预加载用户信息 + 动态路由
 * 3. 加载失败 → 清除登录状态，重定向到 /login
 */
export async function requireAuth({ location }: GuardContext) {
  const { isAuthenticated } = useAuthStore.getState()

  if (!isAuthenticated) {
    redirectToLogin(location.href)
  }

  try {
    await preloadAuthResources()
  } catch {
    useAuthStore.getState().logout()
    redirectToLogin(location.href)
  }
}

/**
 * 登录页守卫：已登录时重定向到首页，避免重复访问登录页。
 */
export function redirectAuthenticated() {
  const { isAuthenticated } = useAuthStore.getState()

  if (isAuthenticated) {
    throw redirect({
      to: '/',
      replace: true,
    })
  }
}
