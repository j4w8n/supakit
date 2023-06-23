import { merge } from '../utils.js'
import type { SecureCookieOptionsPlusName, ServerClientOptions } from '../types/index.js'

const COOKIE_DEFAULTS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365
}
const SERVER_CLIENT_DEFAULTS = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
}
let load_client_cookie_options: SecureCookieOptionsPlusName
let server_client_options: ServerClientOptions

const SERVER_DEFAULTS = {
  cookie_options: COOKIE_DEFAULTS,
  client_options: SERVER_CLIENT_DEFAULTS
}

export const getSupabaseLoadClientCookieOptions = (): SecureCookieOptionsPlusName => {
  return load_client_cookie_options ?? COOKIE_DEFAULTS
}

export const setSupabaseLoadClientCookieOptions = (value: SecureCookieOptionsPlusName) => {
  if (typeof value !== 'object') throw new Error('Cookie options must be an object')

  load_client_cookie_options = merge(COOKIE_DEFAULTS, value)
}

export const getSupabaseServerClientOptions = (): ServerClientOptions => {
  return server_client_options ?? SERVER_DEFAULTS
}

export const setSupabaseServerClientOptions = (value: ServerClientOptions): void => {
  if (typeof value !== 'object') throw new Error('Server options must be an object')
  
  if (value.client_options || value.cookie_options) server_client_options = merge(SERVER_DEFAULTS, value)
}
