import { useMemo } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Breadcrumb } from 'antd'
import { usePermissionStore } from '@/store/usePermissionStore'
import { flattenRoutes, matchRoute } from '@/routes/routeUtils'

export function BreadcrumbNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const dynamicRoutes = usePermissionStore((state) => state.dynamicRoutes)

  const items = useMemo(() => {
    if (dynamicRoutes.length === 0) {
      return [{ title: '首页' }]
    }

    const flatRoutes = flattenRoutes(dynamicRoutes)
    const matched = matchRoute(pathname, dynamicRoutes)

    if (!matched) {
      return [{ title: '首页' }]
    }

    const breadcrumbs: { title: string }[] = [{ title: '首页' }]
    const segments = (matched.fullPath || '').split('/').filter(Boolean)
    let currentPath = ''

    for (const seg of segments) {
      currentPath += `/${seg}`
      const route = flatRoutes.find((r) => r.fullPath === currentPath)
      if (route?.meta?.title && !route.meta.hidden) {
        breadcrumbs.push({ title: route.meta.title })
      }
    }

    if (matched.meta?.hidden && matched.meta?.title) {
      breadcrumbs.push({ title: matched.meta.title })
    }

    return breadcrumbs.filter(
      (item, index, arr) => index === 0 || item.title !== arr[index - 1].title,
    )
  }, [pathname, dynamicRoutes])

  return <Breadcrumb className="mb-[16px]" items={items} />
}
