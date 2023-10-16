import { browserEnv, merge, stringToBoolean } from '../utils.js'
import type { SupabaseConfig } from '../types/index.js'
import { parse, serialize } from 'cookie'
import type { Cookies } from '@sveltejs/kit'
import type { AuthFlowType } from '@supabase/supabase-js'

export const COOKIE_DEFAULTS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365
}

const CLIENT_DEFAULTS = {
  auth: {
    flowType: 'pkce' as AuthFlowType
  }
}
const CONFIG: SupabaseConfig = {
  cookie_options: COOKIE_DEFAULTS,
  client_options: CLIENT_DEFAULTS
}

export let cached_options: SupabaseConfig | null
let options_initialized = false

export const supabaseConfig = (cookies?: Cookies) => {
  const _get = (): SupabaseConfig => {
    /* Config can be retrieved on client-side or server-side */
    if (browserEnv()) {
      const config_cookie = document.cookie
        .split('; ')
        .find((cookie) => cookie.match('sb-config'))

      return config_cookie ? JSON.parse(parse(config_cookie)['sb-config']) : CONFIG
    } else {
      if (!cookies) throw new Error('Getting config on the server requires passing in the SvelteKit `cookies` function.')
      const config_cookie = cookies.get('sb-config')
      return config_cookie ? JSON.parse(config_cookie) : CONFIG
    }
  }
  const _set = (config: Partial<SupabaseConfig>) => {
    if (browserEnv()) throw new Error('Config must be set on the server-side.')
    if (!cookies && options_initialized) throw new Error('Setting config requires passing in the SvelteKit `cookies` function.')
    if (typeof config !== 'object') throw new Error('Config must be an object')

    const merged_config: SupabaseConfig = merge(CONFIG, config)

    if (!cookies) {
      /**
       * Options being set from src/hooks.server.ts,
       * save to memory.
       */
      cached_options = merged_config
      options_initialized = true
    } else {
      /* Clear the cache */
      if (cached_options) cached_options = null

      const cookie_options = config.cookie_options ? merge(COOKIE_DEFAULTS, config.cookie_options) : COOKIE_DEFAULTS

      cookies.set('sb-config', JSON.stringify(merged_config), {
        ...cookie_options,
        httpOnly: false,
        maxAge: COOKIE_DEFAULTS.maxAge
      })
    }
  }

  return {
    get get() { return _get() },
    set set(config: Partial<SupabaseConfig>) { _set(config) }
  }
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
      ...(supabaseConfig().get.cookie_options  ?? COOKIE_DEFAULTS),
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
