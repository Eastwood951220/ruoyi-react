/**
 * 登录请求参数。
 *
 * 对应 RuoYi `/auth/login` 接口入参。
 * 支持账号密码登录、租户切换和图形验证码。
 */
export interface LoginParams {
  /** 租户 ID。多租户模式下用于指定登录租户，为空时使用默认租户。 */
  tenantId?: string

  /** 登录账号（用户名）。 */
  username: string

  /** 登录密码。前端通常先经 RSA 加密再传输。 */
  password: string

  /** 图形验证码。 */
  code?: string

  /** 验证码唯一标识，与 code 配合使用，后端据此找到对应验证码进行校验。 */
  uuid?: string

  /** 客户端 ID。标识调用来源（如 web-app、mobile-app），默认取环境变量。 */
  clientId?: string

  /**
   * 授权类型。
   *
   * - `'password'`：账号密码登录（默认）
   * - `'social'`：第三方社交登录
   */
  grantType?: string
}

/**
 * 注册请求参数。
 *
 * 在登录参数基础上增加确认密码字段，
 * 对应 RuoYi `/auth/register` 接口入参。
 */
export interface RegisterParams extends LoginParams {
  /** 确认密码，需与 password 一致。 */
  confirmPassword?: string

  /** 扩展字段，允许前端传递额外注册信息。 */
  [key: string]: unknown
}

/**
 * 登录成功返回结果。
 *
 * 对应 OAuth2 标准的 Token 响应结构。
 */
export interface LoginResult {
  /** 访问令牌（JWT）。后续请求通过 Authorization 头携带此令牌。 */
  access_token: string

  /** 令牌类型，通常为 `'bearer'`。 */
  token_type?: string

  /** 令牌有效期（秒）。 */
  expires_in?: number
}

/**
 * 图形验证码返回结果。
 *
 * 对应 RuoYi `/auth/code` 接口返回结构。
 */
export interface CaptchaImageResult {
  /** 是否启用验证码。后端可通过配置关闭验证码功能。 */
  captchaEnabled?: boolean

  /** 验证码图片的 Base64 编码字符串，直接赋值给 `<img src>` 即可展示。 */
  img?: string

  /** 验证码唯一标识，登录时作为 uuid 参数回传给后端。 */
  uuid?: string
}

/**
 * 租户列表项。
 *
 * 对应多租户模式下 `/auth/tenant/list` 接口中的单个租户信息。
 */
export interface TenantItem {
  /** 租户名称（企业/公司名称）。 */
  companyName: string

  /** 租户域名。可用于域名自动匹配租户，为空时表示未绑定域名。 */
  domain?: string | null

  /** 租户 ID。登录时作为 tenantId 参数传递。 */
  tenantId: string
}

/**
 * 租户列表返回结果。
 *
 * 对应 RuoYi `/auth/tenant/list` 接口返回结构。
 */
export interface TenantListResult {
  /** 是否启用多租户功能。为 false 时前端无需展示租户选择器。 */
  tenantEnabled?: boolean

  /** 租户列表。 */
  voList?: TenantItem[]
}
