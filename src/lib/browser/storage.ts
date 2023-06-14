import type { SupportedStorage } from '@supabase/supabase-js'
import { getCookieOptions } from '../config/index.js'
import { isBrowser, isAuthToken } from '../utils.js'
import { serialize } from 'cookie'
import { base } from '$app/paths'

let token = ''
let name = ''
let cached_session: {} | null = null

const getCSRF = () => {
  return { token, name }
}

const setCSRF = () => {
  token = crypto.randomUUID()
  name = crypto.randomUUID()
  return { token, name }
}

const cookie_route = `${base}/supakit/cookie`
const csrf_route = `${base}/supakit/csrf`

export const CookieStorage: SupportedStorage = {
  async getItem(key) {
    if (!isBrowser()) return null
    if (isAuthToken(key) && cached_session) return JSON.stringify(cached_session)
    let csrf = getCSRF()

    const getCookie = async () => {
      try {
        const res = await fetch(cookie_route, {
          method: 'GET',
          headers: {
            'x-csrf-token': csrf.token,
            'x-csrf-name': csrf.name,
            'x-storage-key': key
          }
        })

        if (res.status === 200){
          const json: { cookie: any } = res.body ? await res.json() : { cookie: null }
          if (isAuthToken(key)) cached_session = json.cookie

          return json.cookie
        } else {
          return null
        }
      } catch (err: any) {
        console.error('Error getting cookie from server', err)
        return null
      }
    }

    if (csrf.token !== '') {
      return await getCookie()
    } else {
      csrf = setCSRF()

      /**
       * If this is the first visit or the page refreshes,
       * set a temp non-httpOnly cookie for use with initial endpoint calls.
       */
      const cookie_options = getCookieOptions()
      document.cookie = serialize(`sb-${csrf.name}-csrf`, csrf.token, {
        ...cookie_options,
        httpOnly: false,
        maxAge: 5,
        sameSite: 'strict',
        secure: true
      })

      try {
        const res = await fetch(csrf_route, {
          method: 'POST',
          body: JSON.stringify(csrf)
        })

        if (res.status === 200) {
          return await getCookie()
        } else {
          return null
        }
      } catch (err: any) {
        console.error('Error setting CSRF cookie', err)
        throw err
      }
    }
  },
  async setItem(key, value) {
    if (!isBrowser()) return
    if (isAuthToken(key)) cached_session = JSON.parse(value)
    const csrf = getCSRF()
    try {
      const res = await fetch(cookie_route, {
        method: 'POST',
        body: JSON.stringify({ key, value }),
        headers: {
          'x-csrf-token': csrf.token,
          'x-csrf-name': csrf.name
        }
      })
      if (res.status !== 200) console.error('Error setting cookie', res.statusText)
    } catch (err: any) {
      console.error('Error setting cookie', err)
      return
    }
  },
  async removeItem(key) {
    if (!isBrowser()) return
    if (isAuthToken(key)) cached_session = null
    const csrf = getCSRF()
    try {
      const res = await fetch(cookie_route, {
        method: 'DELETE',
        body: JSON.stringify({ key }),
        headers: {
          'x-csrf-token': csrf.token,
          'x-csrf-name': csrf.name
        }
      })
      if (res.status !== 204) console.error('Error deleting cookie', res.statusText)
    } catch (err: any) {
      console.error('Error deleting cookie', err)
      return
    }
  }
}
