/**
 * 路由元信息。
 */
export interface RouterMeta {
  title?: string
  icon?: string
  noCache?: boolean
  link?: string | null
  activeMenu?: string | null
  hidden?: boolean
  /** 固定标签，始终显示在 TagsView 中且不可关闭。 */
  affix?: boolean
  [key: string]: unknown
}

/**
 * 后端路由菜单节点（API 返回的原始结构）。
 */
export interface RouterVo {
  name?: string
  path: string
  hidden?: boolean
  redirect?: string
  component?: string
  query?: string
  alwaysShow?: boolean
  meta?: RouterMeta
  children?: RouterVo[]
}

/**
 * 动态路由配置（中间态，用于创建 TanStack Router 路由）。
 */
export interface DynamicRouteConfig {
  id: string
  path: string
  fullPath: string
  component?: string
  meta?: RouterMeta
  children?: DynamicRouteConfig[]
}

/**
 * 菜单路由项（供 Sidebar 消费）。
 */
export interface MenuRouteItem {
  key: string
  path: string
  name?: string
  title: string
  icon?: string
  hidden: boolean
  alwaysShow: boolean
  link?: string
  activeMenu?: string
  children?: MenuRouteItem[]
}

/** TagsView 标签页视图。 */
export type TagView = {
  path: string
  fullPath: string
  title: string
  name?: string
  query?: Record<string, unknown>
  meta?: {
    title?: string
    icon?: string
    affix?: boolean
    noCache?: boolean
    link?: string | null
    [key: string]: unknown
  }
  closable?: boolean
}
