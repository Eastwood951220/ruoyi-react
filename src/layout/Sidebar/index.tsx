import { useMemo } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { AutoHideScroll } from '@/components/AutoHideScroll'
import SvgIcon from '@/components/SvgIcon'
import { usePermissionStore } from '@/store/usePermissionStore'
import { useThemeStore } from '@/store/useThemeStore'
import { getActiveMenu, getOpenKeys, isExternal } from '@/routes/routeUtils'
import type { MenuRouteItem } from '@/routes/types'
import styles from './Sidebar.module.less'

const { Sider } = Layout

type AntdMenuItem = Required<MenuProps>['items'][number]

function renderIcon(icon?: string) {
  if (!icon) return undefined
  return <SvgIcon name={icon} size={16} />
}

/**
 * 递归构建 Ant Design Menu 菜单项。
 *
 * - 多个可见子菜单或 alwaysShow → 展开为子菜单
 * - 仅一个可见子菜单且无 alwaysShow → 折叠显示子项
 * - 叶子节点 → 直接显示
 */
function buildMenuItems(routes: MenuRouteItem[]): AntdMenuItem[] {
  return routes
    .filter((route) => !route.hidden)
    .map((route) => {
      const visibleChildren = route.children?.filter((child) => !child.hidden) || []
      const label = route.title || route.name || route.path
      const key = route.link || route.path
      const icon = renderIcon(route.icon)

      if (visibleChildren.length > 0 && (route.alwaysShow || visibleChildren.length > 1)) {
        return {
          key,
          label,
          icon,
          children: buildMenuItems(visibleChildren),
        }
      }

      if (visibleChildren.length === 1 && !route.alwaysShow) {
        const child = visibleChildren[0]
        return {
          key: child.link || child.path,
          label: child.title || child.name || child.path,
          icon: renderIcon(child.icon),
        }
      }

      return { key, label, icon }
    })
}

type SideMenuProps = {
  collapsed: boolean
}

export function SideMenu({ collapsed }: SideMenuProps) {
  const navigate = useNavigate()
  const darkMode = useThemeStore((state) => state.darkMode)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const allRoutes = usePermissionStore((state) => state.dynamicRoutes)
  const menuRoutes = usePermissionStore((state) => state.menuRoutes)

  const items = useMemo(() => buildMenuItems(menuRoutes), [menuRoutes])
  const selectedKey = getActiveMenu(pathname, allRoutes)
  const defaultOpenKeys = useMemo(() => getOpenKeys(selectedKey), [selectedKey])

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const keyStr = String(key)
    if (isExternal(keyStr)) {
      window.open(keyStr, '_blank')
      return
    }
    if (keyStr !== pathname) {
      void navigate({ to: keyStr })
    }
  }

  return (
    <Sider
      collapsed={collapsed}
      width={232}
      collapsible={false}
      className={[
        styles.sider,
        darkMode ? styles.dark : '',
        collapsed ? styles.collapsed : '',
      ].filter(Boolean).join(' ')}
    >
      <div className={styles.logo}>
        <span className={styles.logoMark}>RA</span>
        {!collapsed && <span className={styles.logoText}>React Admin</span>}
      </div>

      <div className={styles.menuWrapper}>
        <AutoHideScroll
          direction="vertical"
          className={styles.menuArea}
          contentClassName={styles.menuContent}
        >
          <Menu
            className={styles.menu}
            mode="inline"
            theme={darkMode ? 'dark' : 'light'}
            inlineCollapsed={collapsed}
            selectedKeys={[selectedKey]}
            defaultOpenKeys={defaultOpenKeys}
            items={items}
            onClick={handleMenuClick}
          />
        </AutoHideScroll>
      </div>
    </Sider>
  )
}
