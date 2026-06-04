[root](../../CLAUDE.md) > [src](../) > **request**

# Request Layer

## Responsibility

Axios-based HTTP client wrapper providing token injection, AES+RSA request/response encryption, duplicate submit prevention, request cancellation (AbortController), GET response caching, and repeat strategies.

## Entry Point

`src/request/index.ts` -- exports `request` with `.get()`, `.post()`, `.put()`, `.delete()` methods.

## Architecture

```
instance.ts       -- Axios instance creation with baseURL, timeout, headers
interceptors.ts   -- Request/response interceptors (token, encryption, cache, cancel)
index.ts          -- Public API: request.get/post/put/delete + repeat strategy
types.ts          -- RequestConfig, ApiResponse, RepeatStrategy types
error.ts          -- BusinessError class
errorCode.ts      -- Error code mapping
utils.ts          -- Request key, method extraction, header helpers
cache.ts          -- GET response cache with TTL
cancel.ts         -- AbortController management per request key
crypto.ts         -- AES + RSA encryption/decryption
download.ts       -- File download with blob handling
repeatSubmit.ts   -- Duplicate submit prevention
transform.ts      -- Response transformation and error handling
```

## Key Exports

- `request` -- main HTTP client with `.get()`, `.post()`, `.put()`, `.delete()`
- `download` -- file download function
- `cancelRequest`, `cancelRequestGroup`, `cancelAllRequests` -- request cancellation
- `removeRequestCache`, `clearRequestCache` -- cache management
- `BusinessError` -- custom error class for business logic errors
- `isRelogin` -- check if response indicates re-login needed
- `ApiResponse<T>` -- response type: `{ code, msg, data, rows?, total? }`

## Repeat Strategies

- `reuse` (default for GET) -- reuse pending request
- `cancel-prev` -- cancel previous same request
- `ignore-new` -- ignore new request if one is pending
- `none` -- no deduplication

## Usage Pattern

```ts
import request, { type ApiResponse } from '@/request'

export function listUser(query: UserQuery) {
  return request.get<ApiResponse<UserVO[]>>('/system/user/list', query)
}
```

## Changelog

- 2026-06-04: Initial module documentation generated
