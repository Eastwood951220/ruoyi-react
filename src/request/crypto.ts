import { isNil, isString, trim } from 'lodash'
import type { AxiosResponse } from 'axios'
import { decryptBase64, decryptWithAes, encryptBase64, encryptWithAes, generateAesKey } from '@/utils/crypto'
import { decrypt, encrypt } from '@/utils/jsencrypt'
import type { PlusInternalRequestConfig } from './types'
import { getHeaderValue, getRequestMethod, isTrueLike } from './utils'

const ENCRYPT_HEADER = 'encrypt-key'
const enableEncrypt = import.meta.env.VITE_APP_ENCRYPT === 'true'

/**
 * 对 POST/PUT 请求体执行 AES + RSA 加密。
 *
 * 请求头 encrypt-key 存放 RSA 加密后的 AES key，请求体替换为 AES 密文。
 */
export function encryptRequestData(config: PlusInternalRequestConfig): void {
  const method = getRequestMethod(config)
  const encryptHeaderValue = getHeaderValue(config, 'isEncrypt')
  const shouldEncrypt =
    enableEncrypt &&
    (config.isEncrypt === true || isTrueLike(encryptHeaderValue)) &&
    (method === 'post' || method === 'put')

  if (!shouldEncrypt || isNil(config.data)) {
    return
  }

  const aesKey = generateAesKey()
  const encryptedKey = encrypt(encryptBase64(aesKey))

  if (!encryptedKey) {
    throw new Error('请求参数加密失败，请检查 RSA 公钥配置')
  }

  config.headers.set(ENCRYPT_HEADER, encryptedKey)
  config.data = encryptWithAes(
    isString(config.data) ? config.data : JSON.stringify(config.data),
    aesKey,
  )
}

/**
 * 解密后端响应。
 *
 * 后端如果返回 encrypt-key 响应头，表示 response.data 是 AES 密文。
 */
export function decryptResponseData(response: AxiosResponse): void {
  if (!enableEncrypt) {
    return
  }

  const encryptedKey = response.headers[ENCRYPT_HEADER]

  if (!isString(encryptedKey) || trim(encryptedKey) === '') {
    return
  }

  const base64Key = decrypt(encryptedKey)

  if (!base64Key) {
    throw new Error('响应数据解密失败，请检查 RSA 私钥配置')
  }

  const aesKey = decryptBase64(base64Key)
  const decryptedText = decryptWithAes(String(response.data), aesKey)

  response.data = JSON.parse(decryptedText)
}
