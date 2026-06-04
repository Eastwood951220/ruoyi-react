import { useEffect, useMemo, useState } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { App as AntApp, ConfigProvider, Spin, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { createAppRouter, router as staticRouter } from './routes'
import { useAuthStore } from './store/useAuthStore'
import { usePermissionStore } from './store/usePermissionStore'
import { useThemeStore } from './store/useThemeStore'

function GlobalLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spin size="large" />
    </div>
  )
}

export function Root() {
  const darkMode = useThemeStore((state) => state.darkMode)
  const primaryColor = useThemeStore((state) => state.primaryColor)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const dynamicRoutes = usePermissionStore((state) => state.dynamicRoutes)
  const [ready, setReady] = useState(!isAuthenticated)

  // 同步主题到 DOM
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = darkMode ? 'dark' : 'light'
    root.style.setProperty('--app-primary-color', primaryColor)
  }, [darkMode, primaryColor])

  // 已登录时预加载用户信息 + 动态路由
  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

    async function bootstrap() {
      try {
        const authStore = useAuthStore.getState()
        const permissionStore = usePermissionStore.getState()

        await Promise.all([
          authStore.hasUserInfo ? Promise.resolve() : authStore.loadUserInfo(),
          permissionStore.isRoutesLoaded ? Promise.resolve() : permissionStore.loadRoutes(),
        ])
      } catch (err) {
        console.error('[bootstrap] 加载失败:', err)
        useAuthStore.getState().logout()
      } finally {
        if (!cancelled) {
          setReady(true)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  // 动态路由就绪时构建完整路由树，否则使用静态路由
  // 使用 JSON.stringify 比较避免数组引用变化导致的不必要重建
  const routesKey = isAuthenticated && dynamicRoutes.length > 0
    ? JSON.stringify(dynamicRoutes.map((r) => r.fullPath))
    : ''

  const appRouter = useMemo(() => {
    if (isAuthenticated && dynamicRoutes.length > 0) {
      return createAppRouter(dynamicRoutes)
    }
    return staticRouter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, routesKey])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: primaryColor,
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        {ready ? (
          <RouterProvider router={appRouter} />
        ) : (
          <GlobalLoading />
        )}
      </AntApp>
    </ConfigProvider>
  )
}
