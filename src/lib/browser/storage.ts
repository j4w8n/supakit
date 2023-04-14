import type { SupportedStorage } from '@supabase/supabase-js'
import { browser } from '../utils.js'

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

const isAuthToken = (name: string) => {
  const regex = /^sb-.*-auth-token$/
  return regex.test(name)
}

export const CookieStorage: SupportedStorage = {
  async getItem(key) {
    if (!browser()) return null
    if (isAuthToken(key) && cached_session) return JSON.stringify(cached_session)
    let csrf = getCSRF() ?? null

    const getSession = async () => {
      let session: string | null = null
      try {
        const res = await fetch('/supakit', {
          method: 'GET',
          headers: {
            'x-csrf-token': csrf.token,
            'x-csrf-name': csrf.name,
            'x-storage-key': key
          }
        })
        const json = res.body ? await res.json() : { session: null }
        if (json.session) {
          cached_session = json.session
          session = json.session
        }

        return session
      } catch (err: any) {
        console.log('Error getting session from server', err)
        return null
      }
    }

    if(csrf.token) {
      return await getSession()
    } else {
      csrf = setCSRF()
      try {
        const res = await fetch('/supakitCSRF', {
          method: 'POST',
          body: JSON.stringify(csrf)
        })

        if (res.status === 200) {
          return await getSession()
        } else {
          return null
        }
      } catch (err: any) {
        console.log('Error setting CSRF cookie', err)
        return null
      }
    }
  },
  async setItem(key, value) {
    if (!browser()) return
    if (isAuthToken(key)) cached_session = JSON.parse(value)
    const csrf = getCSRF()
    try {
      const res = await fetch('/supakit', {
        method: 'POST',
        body: JSON.stringify({ key, value }),
        headers: {
          'x-csrf-token': csrf.token,
          'x-csrf-name': csrf.name
        }
      })
      if (res.status !== 200) console.log('Error setting session', res.statusText)
    } catch (err: any) {
      console.log('Error setting session', err)
      return
    }
  },
  async removeItem(key) {
    if (!browser()) return
    if (isAuthToken(key)) cached_session = null
    const csrf = getCSRF()
    try {
      const res = await fetch('/supakit', {
        method: 'DELETE',
        body: JSON.stringify({ key }),
        headers: {
          'x-csrf-token': csrf.token,
          'x-csrf-name': csrf.name
        }
      })
      if (res.status !== 204) console.log('Error deleting session', res.statusText)
    } catch (err: any) {
      console.log('Error deleting session', err)
      return
    }
  }
}
