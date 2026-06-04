[root](../../CLAUDE.md) > [src](../) > **routes**

# Routes

## Responsibility

Static and dynamic routing system. Static routes define login, dashboard, error pages. Dynamic routes are fetched from the backend at runtime and transformed into TanStack Router route objects.

## Entry Point

`src/routes/index.tsx` -- exports `createAppRouter` and `router`.

## Architecture

```
index.tsx            -- Static route tree (login, protected layout, dashboard, errors)
routeTransform.tsx   -- buildDynamicRouteConfigs() + createDynamicRoutes()
guards.ts            -- requireAuth, redirectAuthenticated route guards
routeUtils.ts        -- Path utilities, menu route conversion, route matching
types.ts             -- DynamicRouteConfig, MenuRouteItem, TagView, RouterVo types
```

## Static Routes

- `/login` -- LoginPage (redirectAuthenticated guard)
- `/` -- DashboardPage (requireAuth guard, inside AppLayout)
- `/403` -- ForbiddenPage
- `/*` -- NotFoundPage

## Dynamic Route Flow

1. `usePermissionStore.loadRoutes()` fetches `/system/menu/getRouters`
2. `buildDynamicRouteConfigs()` transforms `RouterVo[]` to `DynamicRouteConfig[]`
3. `createDynamicRoutes()` creates TanStack Router route objects
4. `import.meta.glob('/src/features/**/*.tsx')` lazy-loads page components
5. Backend `component` field maps to `src/features/{component}.tsx`

## Special Component Mapping

- `"Layout"` -> `AppLayout` (children promoted, no route created)
- `"ParentView"` -> `ParentView` (children promoted)

## Route Guards

- `requireAuth` -- checks auth, preloads user info + routes, redirects to /login on failure
- `redirectAuthenticated` -- redirects logged-in users away from /login

## Changelog

- 2026-06-04: Initial module documentation generated
