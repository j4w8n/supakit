import type { SupportedStorage } from '@supabase/supabase-js'
import { browserEnv, isAuthToken } from '../utils.js'
import { base } from '$app/paths'

let token = ''
let name = ''
let cached_session: {} | null = null

const getCsrf = () => {
  return { token, name }
}

const setCsrf = () => {
  token = crypto.randomUUID()
  name = crypto.randomUUID()
  return { token, name }
}

const cookie_route = `${base}/supakit/cookie`
const csrf_route = `${base}/supakit/csrf`

export const CookieStorage: SupportedStorage = {
  async getItem(key) {
    if (!browserEnv()) return null
    if (isAuthToken(key) && cached_session) return cached_session
    let csrf = getCsrf()

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
      csrf = setCsrf()

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
    if (!browserEnv()) return
    if (isAuthToken(key)) cached_session = JSON.parse(value)
    const csrf = getCsrf()
    try {
      const res = await fetch(cookie_route, {
        method: 'POST',
        body: JSON.stringify({ name: key, value }),
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
    if (!browserEnv()) return
    if (isAuthToken(key)) cached_session = null
    const csrf = getCsrf()
    try {
      const res = await fetch(cookie_route, {
        method: 'DELETE',
        body: JSON.stringify({ name: key, value: '' }),
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
