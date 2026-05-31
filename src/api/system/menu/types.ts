/**
 * 路由元信息。
 *
 * 对应后端 RuoYi sys_menu 表中的部分字段，
 * 用于前端路由渲染和菜单展示。
 */
export interface RouterMeta {
  /** 菜单标题，同时作为浏览器标签页标题。 */
  title?: string

  /** 菜单图标名称，通常为 @ant-design/icons 组件名。 */
  icon?: string

  /** true 时该页面不被缓存（keep-alive 排除）。 */
  noCache?: boolean

  /** 外链地址。设置后点击菜单直接跳转外部链接，不加载 component。 */
  link?: string | null

  /** 高亮激活的菜单路径。当页面不在菜单中但需要高亮某个父级菜单时使用。 */
  activeMenu?: string | null

  /** 扩展字段，允许后端自定义额外元数据。 */
  [key: string]: unknown
}

/**
 * 后端路由菜单节点。
 *
 * 对应 RuoYi `/system/menu/getRouters` 接口返回的树形结构，
 * 由前端递归转换为 React Router 路由配置。
 */
export interface RouterVo {
  /** 路由名称，用于命名路由（Named Route）。 */
  name?: string

  /** 路由路径，相对于父路由。顶级路由通常以 `/` 开头。 */
  path: string

  /** true 时该路由不在菜单中显示，但仍可被导航访问。 */
  hidden?: boolean

  /** 重定向路径。当访问该路由时自动跳转到 redirect 指定的地址。 */
  redirect?: string

  /**
   * 组件路径。
   *
   * 对应 `src/views/` 下的文件路径，例如 `system/user/index`。
   * 后端存储时通常省略 `src/views/` 前缀和 `.tsx` 后缀，
   * 前端拼接后动态 import。
   */
  component?: string

  /** 路由参数，以 `key=value&key2=value2` 格式传递。 */
  query?: string

  /** true 时即使只有一个子路由也始终显示父级菜单（不折叠）。 */
  alwaysShow?: boolean

  /** 路由元信息。 */
  meta?: RouterMeta

  /** 子路由列表。 */
  children?: RouterVo[]
}
