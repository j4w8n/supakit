import defaults from './defaults.js'
import { merge } from './utils.js'
import type { CookieOptions } from 'supakit'

let cookie_options: CookieOptions

export const getCookieOptions = async (): Promise<CookieOptions> => {
  return cookie_options ?? defaults
}

export const setCookieOptions = (value: CookieOptions) => {
  if (typeof value !== 'object') throw new Error('Cookie options must be an object')
  /**
   * TODO: validate cookie_options before merging
   */

  cookie_options = merge(defaults, value)
}
