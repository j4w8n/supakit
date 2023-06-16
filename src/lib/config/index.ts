import { merge } from '../utils.js'
import type { SecureCookieOptions } from '../types/index.js'

const defaults = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365
}
let cookie_options: SecureCookieOptions

export const getCookieOptions = (): SecureCookieOptions => {
  return cookie_options ?? defaults
}

export const setCookieOptions = (value: SecureCookieOptions) => {
  if (typeof value !== 'object') throw new Error('Cookie options must be an object')

  cookie_options = merge(defaults, value)
}
