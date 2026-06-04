import type { DynamicRouteConfig, MenuRouteItem, TagView } from './types'

/** 判断是否为外部链接。 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/** 拼接父子路径，处理斜杠。 */
export function normalizeFullPath(parentPath: string, path: string): string {
  const parent = parentPath.replace(/\/+$/, '')
  const child = path.replace(/^\/+/, '')
  return `${parent}/${child}`
}

// ---- 缓存层 ----

/** 路由数组引用 → 展平结果缓存 */
const flattenCache = new WeakMap<DynamicRouteConfig[], DynamicRouteConfig[]>()

/** 路径模式 → 预编译正则缓存 */
const patternCache = new Map<string, RegExp>()

/** pathname → 匹配结果缓存（LRU，最多 256 条） */
const matchCache = new Map<string, DynamicRouteConfig | undefined>()
const MATCH_CACHE_MAX = 256

function getOrCompilePattern(fullPath: string): RegExp {
  let re = patternCache.get(fullPath)
  if (!re) {
    re = new RegExp(`^${fullPath.replace(/:[^/]+/g, '[^/]+')}$`)
    patternCache.set(fullPath, re)
  }
  return re
}

/** 递归展平路由树为一维数组（带缓存）。 */
export function flattenRoutes(routes: DynamicRouteConfig[]): DynamicRouteConfig[] {
  const cached = flattenCache.get(routes)
  if (cached) return cached

  const result: DynamicRouteConfig[] = []
  for (const route of routes) {
    result.push(route)
    if (route.children?.length) {
      result.push(...flattenRoutes(route.children))
    }
  }

  flattenCache.set(routes, result)
  return result
}

/**
 * 在路由列表中匹配当前 pathname，返回匹配的路由配置。
 * 支持参数化路径（如 `/user/:id`）。
 * 结果按 (routes 引用, pathname) 缓存。
 */
export function matchRoute(
  pathname: string,
  routes: DynamicRouteConfig[],
): DynamicRouteConfig | undefined {
  const cacheKey = pathname
  const cached = matchCache.get(cacheKey)
  if (cached !== undefined || matchCache.has(cacheKey)) return cached

  const flat = flattenRoutes(routes)

  const matched = flat.find((route) => {
    const fullPath = route.fullPath
    if (!fullPath || isExternal(fullPath)) return false
    if (fullPath === pathname) return true
    if (fullPath.includes(':')) {
      return getOrCompilePattern(fullPath).test(pathname)
    }
    return false
  })

  if (matchCache.size >= MATCH_CACHE_MAX) {
    const firstKey = matchCache.keys().next().value
    if (firstKey !== undefined) matchCache.delete(firstKey)
  }
  matchCache.set(cacheKey, matched)

  return matched
}

/** 清除路由匹配缓存（路由变化时调用）。 */
export function clearRouteCaches(): void {
  matchCache.clear()
  patternCache.clear()
}

/**
 * 匹配当前 pathname 对应的路由，返回其 activeMenu 或 fullPath。
 * 用于 Sidebar 高亮。
 */
export function getActiveMenu(
  pathname: string,
  routes: DynamicRouteConfig[],
): string {
  const matched = matchRoute(pathname, routes)
  return matched?.meta?.activeMenu || matched?.fullPath || pathname
}

/**
 * 根据当前选中路径计算需要展开的父级菜单 key 列表。
 */
export function getOpenKeys(activePath: string): string[] {
  const segments = activePath.split('/').filter(Boolean)
  const keys: string[] = []
  let current = ''

  for (const seg of segments) {
    current += `/${seg}`
    keys.push(current)
  }

  return keys
}

/**
 * 将 DynamicRouteConfig[] 转换为 MenuRouteItem[]（供 Sidebar 使用）。
 */
export function toMenuRoutes(routes: DynamicRouteConfig[]): MenuRouteItem[] {
  return routes
    .filter((route) => !route.meta?.hidden)
    .map((route) => ({
      key: route.meta?.link || route.fullPath || route.path,
      path: route.fullPath || route.path,
      name: route.meta?.title,
      title: route.meta?.title || route.path,
      icon: route.meta?.icon,
      hidden: Boolean(route.meta?.hidden),
      alwaysShow: Boolean(route.meta?.activeMenu),
      link: route.meta?.link ?? undefined,
      activeMenu: route.meta?.activeMenu ?? undefined,
      children: route.children ? toMenuRoutes(route.children) : undefined,
    }))
}

/**
 * 拼接 pathname 和 search 为完整路径。
 */
export function getFullPath(pathname: string, searchStr?: string): string {
  if (!searchStr || searchStr === '?') return pathname
  return `${pathname}${searchStr.startsWith('?') ? searchStr : `?${searchStr}`}`
}

/**
 * 获取标签标题，优先级： route meta title > query.title > fallback。
 */
export function getTagTitle(
  meta: { title?: string } | undefined,
  searchParams: URLSearchParams,
  fallback = '未命名',
): string {
  return  meta?.title || searchParams.get('title') || fallback
}

/**
 * 递归提取 affix 路由，生成固定标签列表。
 */
export function flattenAffixRoutes(routes: DynamicRouteConfig[]): TagView[] {
  const result: TagView[] = []

  for (const route of routes) {
    if (route.meta?.affix && !route.meta?.hidden) {
      result.push({
        path: route.fullPath || route.path,
        fullPath: route.fullPath || route.path,
        title: route.meta?.title || route.path,
        meta: route.meta,
        closable: false,
      })
    }
    if (route.children?.length) {
      result.push(...flattenAffixRoutes(route.children))
    }
  }

  return result
}
