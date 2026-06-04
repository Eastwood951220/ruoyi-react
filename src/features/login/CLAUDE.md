[root](../../../CLAUDE.md) > [features](../../) > **login**

# Login Page

## Responsibility

Login form with captcha verification, tenant selector (multi-tenant mode), remember me functionality, and social login callback support.

## Entry Point

`src/features/login/LoginPage.tsx`

## Structure

```
LoginPage.tsx          -- Login form component
LoginPage.module.less  -- Login page styles
```

## Key Features

- Username/password login with RSA encryption
- Captcha image (Base64) with refresh
- Tenant selector (multi-tenant mode)
- Remember me (stores credentials in cookies with base64 encoding)
- Social login callback support
- Theme mode toggle
- Redirect back to original URL after login

## Key Dependencies

- `src/api/login/` -- login, getCodeImg, getTenantList
- `useAuthStore` -- setLoginState
- `ThemeModeToggle` -- theme switching on login page

## Flow

1. Page loads -> fetch tenant list + captcha image
2. User fills form -> submit -> `login()` API call
3. On success -> `setLoginState(token)` -> navigate to redirect URL or `/`
4. On failure -> refresh captcha

## Changelog

- 2026-06-04: Initial module documentation generated
