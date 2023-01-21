import defaults from './defaults.js'
import { merge } from './utils.js'
import type { CookieSerializeOptions } from 'cookie'

let cookie_options: CookieSerializeOptions

export const getCookieOptions = async (): Promise<CookieSerializeOptions> => {
  return cookie_options ?? defaults
}

export const setCookieOptions = (value: CookieSerializeOptions) => {
  if (typeof value !== 'object') throw new Error('Cookie options must be an object')
  /**
   * TODO: validate cookie_options before merging
   */

  cookie_options = merge(defaults, value)
}
