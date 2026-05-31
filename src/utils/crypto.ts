import CryptoJS from 'crypto-js'
import random from 'lodash/random'

const AES_KEY_LENGTH = 32
const AES_KEY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateRandomString(): string {
  let result = ''
  for (let index = 0; index < AES_KEY_LENGTH; index += 1) {
    result += AES_KEY_CHARS.charAt(random(0, AES_KEY_CHARS.length - 1))
  }
  return result
}

export function generateAesKey(): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Utf8.parse(generateRandomString())
}

export function encryptBase64(value: CryptoJS.lib.WordArray): string {
  return CryptoJS.enc.Base64.stringify(value)
}

export function decryptBase64(value: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Base64.parse(value)
}

export function encryptWithAes(message: string, aesKey: CryptoJS.lib.WordArray): string {
  return CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString()
}

export function decryptWithAes(message: string, aesKey: CryptoJS.lib.WordArray): string {
  return CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8)
}
