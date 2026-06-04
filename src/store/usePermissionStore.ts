import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getRouters } from '@/api/system/menu'
import { buildDynamicRouteConfigs } from '@/routes/routeTransform'
import { toMenuRoutes, clearRouteCaches } from '@/routes/routeUtils'
import type { DynamicRouteConfig, MenuRouteItem } from '@/routes/types'

type PermissionState = {
  dynamicRoutes: DynamicRouteConfig[]
  menuRoutes: MenuRouteItem[]
  isRoutesLoaded: boolean
  loadRoutes: () => Promise<void>
  resetRoutes: () => void
}

export const usePermissionStore = create<PermissionState>()(
  devtools(
    (set) => ({
      dynamicRoutes: [],
      menuRoutes: [],
      isRoutesLoaded: false,

      loadRoutes: async () => {
        const response = await getRouters()
        const rawRoutes = response.data ?? []
        clearRouteCaches()
        const dynamicRoutes = buildDynamicRouteConfigs(rawRoutes)
        const menuRoutes = toMenuRoutes(dynamicRoutes)

        set({
          dynamicRoutes,
          menuRoutes,
          isRoutesLoaded: true,
        })
      },

      resetRoutes: () => {
        set({
          dynamicRoutes: [],
          menuRoutes: [],
          isRoutesLoaded: false,
        })
      },
    }),
    { name: 'ruoyi-react-permission' },
  ),
)
