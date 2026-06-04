import React, { Suspense, lazy } from 'react'
import { createRoute } from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import { AppLayout } from '@/layout/AppLayout'
import { ParentView } from '@/layout/ParentView'
import type { DynamicRouteConfig } from './types'
import { isExternal, normalizeFullPath } from './routeUtils'
import type { RouterVo } from '@/api/system/menu/types'

const featureModules = import.meta.glob('/src/features/**/*.tsx')

const specialComponentMap: Record<string, React.ComponentType> = {
  Layout: AppLayout,
  ParentView: ParentView,
}

const pageLoadingFallback = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 200 }}>
    <span>加载中...</span>
  </div>
)

const notFoundFallback = <div>页面不存在</div>

/** 缓存已创建的 lazy 组件，避免 Router 重建时重复创建 */
const lazyComponentCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>()

function getOrCreateLazy(importer: () => Promise<{ default: React.ComponentType }>, cacheKey: string) {
  let cached = lazyComponentCache.get(cacheKey)
  if (!cached) {
    cached = lazy(importer)
    lazyComponentCache.set(cacheKey, cached)
  }
  return cached
}

function lazyElement(importer: () => Promise<{ default: React.ComponentType }>, cacheKey: string) {
  const Component = getOrCreateLazy(importer, cacheKey)

  return (
    <Suspense fallback={pageLoadingFallback}>
      <Component />
    </Suspense>
  )
}

function loadRouteElement(component?: string): React.ReactNode {
  if (!component) return undefined

  if (component in specialComponentMap) {
    const Component = specialComponentMap[component]
    return <Component />
  }

  const modulePath = `/src/features/${component}.tsx`
  const importer = featureModules[modulePath] as (() => Promise<{ default: React.ComponentType }>) | undefined

  if (!importer) {
    console.warn(`[dynamic-route] component not found: ${component}, expected: ${modulePath}`)
    const fallback = featureModules['/src/features/error/NotFoundPage.tsx'] as (() => Promise<{ default: React.ComponentType }>) | undefined
    return fallback ? lazyElement(fallback, '__NotFoundPage__') : notFoundFallback
  }

  return lazyElement(importer, modulePath)
}

/**
 * 将后端 RouterVo[] 递归转换为 DynamicRouteConfig[]。
 * 计算每个路由的 fullPath，用于后续 TanStack Router 路由创建。
 */
export function buildDynamicRouteConfigs(
  routes: RouterVo[],
  parentFullPath = '',
): DynamicRouteConfig[] {
  return routes.map((route) => {
    const fullPath = normalizeFullPath(parentFullPath, route.path)

    const config: DynamicRouteConfig = {
      id: route.name || route.path,
      path: route.path,
      fullPath,
      component: route.component,
      meta: {
        ...route.meta,
        hidden: route.hidden,
        alwaysShow: route.alwaysShow,
        fullPath,
      },
    }

    if (route.children?.length) {
      config.children = buildDynamicRouteConfigs(route.children, fullPath)
    }

    return config
  })
}

/**
 * 创建单个动态路由。
 *
 * 返回数组，因为 Layout 组件会被扁平化（不创建路由，子路由直接提升到父级）。
 */
function createSingleRoute(
  config: DynamicRouteConfig,
  parentRoute: AnyRoute,
): AnyRoute[] {
  const isLayout = config.component === 'Layout'
  const isParent = config.component === 'ParentView'
  const hasChildren = config.children && config.children.length > 0
  const link = config.meta?.link

  // Layout 组件不创建路由，子路由提升到父级
  if (isLayout && hasChildren) {
    const promotedChildren = config.children!.map((child) => ({
      ...child,
      path: child.fullPath || child.path,
    }))
    return createDynamicRoutes(promotedChildren, parentRoute)
  }

  let element: React.ReactNode

  if (link && isExternal(link)) {
    element = undefined
  } else if (config.meta?.hidden && config.meta?.activeMenu) {
    // 隐藏但有 activeMenu 的路由仍需加载组件（用于标签页导航）
    element = loadRouteElement(config.component)
  } else if (isParent || (hasChildren && !config.component)) {
    element = <ParentView />
  } else {
    element = loadRouteElement(config.component)
  }

  let routeComponent: (() => React.ReactElement) | undefined

  if (!isLayout && !isParent && !config.component && !hasChildren) {
    routeComponent = undefined
  } else if (element !== undefined) {
    routeComponent = () => element as React.ReactElement
  }

  const route = createRoute({
    getParentRoute: () => parentRoute,
    path: config.path,
    ...(routeComponent ? { component: routeComponent } : {}),
  } as Parameters<typeof createRoute>[0])

  if (hasChildren && config.children) {
    const childRoutes = createDynamicRoutes(config.children, route)
    route.addChildren(childRoutes)
  }

  return [route]
}

export function createDynamicRoutes(
  configs: DynamicRouteConfig[],
  parentRoute: AnyRoute,
): AnyRoute[] {
  return configs.flatMap((config) => createSingleRoute(config, parentRoute))
}
