import type { GoTrueClientOptions } from '@supabase/supabase-js'
import type { RequestEvent } from '@sveltejs/kit'
import { getCookieOptions, isAuthToken, isProviderToken, stringToBoolean, testRegEx } from '../utils.js'
import type { CookieOptions, SvelteKitCookieOptions } from '../types/index.js'

interface StorageAdapter extends Exclude<GoTrueClientOptions['storage'], undefined> {}

export class CookieStorage implements StorageAdapter {
  constructor(
    private readonly event: Pick<RequestEvent, 'cookies'> & CookieOptions
  ) { }

  getItem(key: string) {
    const cookie = this.event.cookies.get(key) ?? null
    return cookie
  }
  setItem(key: string, value: string) {
    const remember_me_cookie = this.event.cookies.get('supakit-rememberme') ?? 'true'
    const remember_me = stringToBoolean(remember_me_cookie)
    const { session_cookie_options, remember_me_cookie_options } = getCookieOptions('all', this.event.cookie_options)

    if ((!remember_me && (isAuthToken(key) || isProviderToken(key)))) {
      this.event.cookies.set(key, value, session_cookie_options as SvelteKitCookieOptions)
    } else if (testRegEx(key, 'remember_me')) {
      this.event.cookies.set(key, value, remember_me_cookie_options as SvelteKitCookieOptions)
    } else {
      this.event.cookies.set(key, value, this.event.cookie_options)
    }
  }
  removeItem(key: string) {
    const { expire_cookie_options }= getCookieOptions('expire', this.event.cookie_options)
    this.event.cookies.delete(key, expire_cookie_options as SvelteKitCookieOptions)
    if (isAuthToken(key)) {
      if (this.event.cookies.get('sb-provider-token')) this.event.cookies.delete('sb-provider-token', expire_cookie_options as SvelteKitCookieOptions)
      if (this.event.cookies.get('sb-provider-refresh-token')) this.event.cookies.delete('sb-provider-refresh-token', expire_cookie_options as SvelteKitCookieOptions)
    }
  }
}
