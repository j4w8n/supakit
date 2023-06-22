import { merge } from '../utils.js'
import type { SecureCookieOptionsPlusName } from '../types/index.js'

const defaults = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365
}
let cookie_options: SecureCookieOptionsPlusName

export const getCookieOptions = (): SecureCookieOptionsPlusName => {
  return cookie_options ?? defaults
}

export const setCookieOptions = (value: SecureCookieOptionsPlusName) => {
  if (typeof value !== 'object') throw new Error('Cookie options must be an object')

  cookie_options = merge(defaults, value)
}
