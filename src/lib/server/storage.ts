import type { GoTrueClientOptions } from '@supabase/supabase-js'
import type { RequestEvent } from '@sveltejs/kit'
import { getCookieOptions, isAuthToken, isProviderToken, stringToBoolean, testRegEx } from '../utils.js'
import type { EventCookieOptions } from '../types/index.js'
import { supabaseConfig } from '../config/index.js'

interface StorageAdapter extends Exclude<GoTrueClientOptions['storage'], undefined> {}

export class CookieStorage implements StorageAdapter {
  constructor(
    private readonly event: Pick<RequestEvent, 'cookies'> & EventCookieOptions
  ) { }

  getItem(key: string) {
    const cookie = this.event.cookies.get(key) ?? null
    return cookie
  }
  setItem(key: string, value: string) {
    const remember_me_cookie = this.event.cookies.get('supakit-rememberme') ?? 'true'
    const remember_me = stringToBoolean(remember_me_cookie)
    const { session_cookie_options, remember_me_cookie_options } = getCookieOptions({ options: this.event.cookie_options, type: 'all' })

    if ((!remember_me && (supabaseConfig({ cookies: this.event.cookies }).get.client_options.auth?.storageKey === key || isAuthToken(key) || isProviderToken(key)))) {
      this.event.cookies.set(key, value, session_cookie_options)
    } else if (testRegEx({ string: key, type: 'remember_me' })) {
      this.event.cookies.set(key, value, remember_me_cookie_options)
    } else {
      this.event.cookies.set(key, value, this.event.cookie_options)
    }
  }
  removeItem(key: string) {
    const { expire_cookie_options }= getCookieOptions({ options: this.event.cookie_options, type: 'expire' })
    this.event.cookies.delete(key, expire_cookie_options)
    if (supabaseConfig({ cookies: this.event.cookies }).get.client_options.auth?.storageKey === key || isAuthToken(key)) {
      if (this.event.cookies.get('sb-provider-token')) this.event.cookies.delete('sb-provider-token')
      if (this.event.cookies.get('sb-provider-refresh-token')) this.event.cookies.delete('sb-provider-refresh-token')
    }
  }
}
