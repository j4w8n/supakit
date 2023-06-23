import type { GoTrueClientOptions } from '@supabase/supabase-js'
import type { RequestEvent } from '@sveltejs/kit'
import { isAuthToken } from '../utils.js'
import type { ServerClientOptions } from '../types/index.js'

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
    this.event.cookies.set(key, value, this.event.cookie_options)
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
