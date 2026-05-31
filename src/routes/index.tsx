import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppLayout } from '@/layout/AppLayout'
import { LoginPage } from '@/features/login/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import ForbiddenPage from '@/features/error/ForbiddenPage'
import NotFoundPage from '@/features/error/NotFoundPage'
import { redirectAuthenticated, requireAuth } from './guards'
import { createDynamicRoutes } from './routeTransform'
import type { DynamicRouteConfig } from './types'

// ---- 根路由 ----

export const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// ---- 登录页（已登录则跳转首页） ----

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: redirectAuthenticated,
  component: LoginPage,
})

// ---- 受保护布局（未登录跳转登录页） ----

export const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: requireAuth,
  component: AppLayout,
})

// ---- 首页 ----

export const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: DashboardPage,
})

// ---- 错误页（无布局包裹） ----

const errorLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'error-layout',
  component: () => <Outlet />,
})

const error403Route = createRoute({
  getParentRoute: () => errorLayoutRoute,
  path: '/403',
  component: ForbiddenPage,
})

const notFoundRoute = createRoute({
  getParentRoute: () => errorLayoutRoute,
  path: '$',
  component: NotFoundPage,
})

// ---- 路由树组装 ----

function buildRouteTree(dynamicRouteConfigs: DynamicRouteConfig[] = []) {
  const dynamicRoutes = createDynamicRoutes(dynamicRouteConfigs, protectedRoute)
  const protectedChildren = [indexRoute, ...dynamicRoutes]

  return rootRoute.addChildren([
    protectedRoute.addChildren(protectedChildren),
    loginRoute,
    errorLayoutRoute.addChildren([error403Route, notFoundRoute]),
  ])
}

/**
 * 创建应用路由器。
 *
 * @param dynamicRouteConfigs - 后端动态路由配置，为空时仅包含首页。
 */
export function createAppRouter(dynamicRouteConfigs: DynamicRouteConfig[] = []) {
  const routeTree = buildRouteTree(dynamicRouteConfigs)

  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
  })
}

/** 默认静态路由（无动态路由），用于初始渲染。 */
export const router = createAppRouter()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
