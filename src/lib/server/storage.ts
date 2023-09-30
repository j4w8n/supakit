import type { GoTrueClientOptions } from '@supabase/supabase-js'
import type { RequestEvent } from '@sveltejs/kit'
import { isAuthToken, isProviderToken } from '../utils.js'
import type { ServerClientOptions, GenericObjectOptions } from '../types/index.js'

interface StorageAdapter extends Exclude<GoTrueClientOptions['storage'], undefined> {}

export class CookieStorage implements StorageAdapter {
  constructor(
    private readonly event: Pick<RequestEvent, 'cookies'> & Pick<ServerClientOptions, 'cookie_options'>
  ) { }

  getItem(key: string) {
    const cookie = this.event.cookies.get(key) ?? null
    return cookie
  }
  setItem(key: string, value: string) {
    let remember_me
    const remember_me_cookie = this.event.cookies.get('supakit-rememberme') ?? 'false'

    switch (remember_me_cookie) {
      case 'true':
        remember_me = true
        break;
      case 'false':
        remember_me = false
        break;
    }

    const remember_me_cookie_regex = /^supakit-rememberme$/
    //@ts-ignore
    const { maxAge, expires, name, ...session_cookie_options } = this.event.cookie_options
    //@ts-ignore
    const { httpOnly, ...rest_cookie_options } = session_cookie_options
    const remember_me_cookie_options = {
      ...rest_cookie_options,
      httpOnly: false,
      maxAge
    }

    if ((!remember_me && (isAuthToken(key) || isProviderToken(key)))) {
      this.event.cookies.set(key, value, session_cookie_options)
    } else if (remember_me_cookie_regex.test(key)) {
      this.event.cookies.set(key, value, remember_me_cookie_options)
    } else {
      this.event.cookies.set(key, value, this.event.cookie_options)
    }
  }
  removeItem(key: string) {
    this.event.cookies.delete(key, {
      ...this.event.cookie_options,
      maxAge: -1
    })
    if (isAuthToken(key)) {
      if (this.event.cookies.get('sb-provider-token')) this.event.cookies.delete('sb-provider-token')
      if (this.event.cookies.get('sb-provider-refresh-token')) this.event.cookies.delete('sb-provider-refresh-token')
    }
  }
}
