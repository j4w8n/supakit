import type { GoTrueClientOptions } from '@supabase/supabase-js'
import type { RequestEvent } from '@sveltejs/kit'

interface StorageAdapter extends Exclude<GoTrueClientOptions['storage'], undefined> {}

export class CookieStorage implements StorageAdapter {
  constructor(
    private readonly event: Pick<RequestEvent, 'cookies' | 'locals'>
  ) { }

  async getItem(key: string) {
    const cookie = this.event.cookies.get(key) ?? null
    return cookie
  }
  async setItem(key: string, value: string) {
    this.event.cookies.set(key, value, this.event.locals.cookie_options)
  }
  async removeItem(key: string) {
    this.event.cookies.delete(key, this.event.locals.cookie_options)
  }
}
