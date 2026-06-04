[root](../../../CLAUDE.md) > [api](../) > **login**

# Login API

## Responsibility

Authentication-related API functions: login, register, logout, captcha, tenant list, social callback.

## Entry Point

`src/api/login/index.ts`

## Exports

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `login` | POST | `/auth/login` | Account password login (encrypted) |
| `register` | POST | `/auth/register` | User registration (encrypted) |
| `logout` | POST | `/auth/logout` | Logout, clear server session |
| `getCodeImg` | GET | `/auth/code` | Get captcha image (Base64) |
| `callback` | POST | `/auth/social/callback` | Social login OAuth2 callback |
| `getTenantList` | GET | `/auth/tenant/list` | Get tenant list for multi-tenant mode |

## Types (types.ts)

- `LoginParams` -- login request parameters
- `RegisterParams` -- registration parameters (extends LoginParams)
- `LoginResult` -- OAuth2 token response (access_token, token_type, expires_in)
- `CaptchaImageResult` -- captcha image and uuid
- `TenantItem` / `TenantListResult` -- tenant information

## Changelog

- 2026-06-04: Initial module documentation generated
