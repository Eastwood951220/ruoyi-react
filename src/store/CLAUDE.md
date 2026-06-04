[root](../../CLAUDE.md) > [src](../) > **store**

# Stores (Zustand)

## Responsibility

Global state management using Zustand with devtools middleware. Five stores manage auth, permissions, theme, dictionary cache, and tab navigation.

## Stores

### useAuthStore (`useAuthStore.ts`)

- **Persisted**: Yes (token, isAuthenticated)
- **State**: token, userInfo, roles, permissions, isAuthenticated, hasUserInfo
- **Actions**: setLoginState, setUserInfo, loadUserInfo, logout
- **Dependencies**: usePermissionStore, useTagsViewStore (reset on logout)

### usePermissionStore (`usePermissionStore.ts`)

- **Persisted**: No
- **State**: dynamicRoutes, menuRoutes, isRoutesLoaded
- **Actions**: loadRoutes, resetRoutes
- **Dependencies**: None

### useThemeStore (`useThemeStore.ts`)

- **Persisted**: Yes
- **State**: mode, darkMode, primaryColor
- **Actions**: setMode, setDarkMode, toggleMode, setPrimaryColor

### useDictStore (`useDictStore.ts`)

- **Persisted**: No
- **State**: cache (Map), loadingMap (Map)
- **Actions**: getDict, setDict, removeDict, cleanDict, loadDict
- **Dependencies**: getDicts API

### useTagsViewStore (`useTagsViewStore.ts`)

- **Persisted**: Yes (visitedViews)
- **State**: visitedViews (TagView[])
- **Actions**: addView, removeView, removeSelectedView, removeOtherViews, removeAllViews, resetViews

## Cross-Store Communication

Stores call each other via `useXxxStore.getState()`:
- `logout()` in auth store resets permission and tags stores

## Changelog

- 2026-06-04: Initial module documentation generated
