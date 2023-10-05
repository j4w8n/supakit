import { merge, stringToBoolean } from '../utils.js'
import type { SecureCookieOptionsPlusName, ServerClientOptions } from '../types/index.js'
import { serialize } from 'cookie'

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

export const rememberMe = () => {
  const _get = (): boolean => {
    const remember_me_cookie = document.cookie
      .split('; ')
      .find((cookie) => cookie.match('supakit-rememberme'))
      ?.split('=')[1]

    return remember_me_cookie ? stringToBoolean(remember_me_cookie) : _set(true)
  }
  const _set = (value: boolean) => {
    document.cookie = serialize('supakit-rememberme', JSON.stringify(value), {
      ...(server_client_options ?? COOKIE_DEFAULTS),
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365 * 100,
      sameSite: 'lax'
    })
    return value
  }
  const _toggle = (): boolean => {
    const current = _get()
    return _set(!current)
  }

  return {
    get value() { return _get() },
    set value(v: boolean) { _set(v) },
    get toggle() { return _toggle() }
  }

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
