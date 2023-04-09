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

export const CookieStorage: SupportedStorage = {
  getItem(key) {
    if (!browser()) return null
    if (cached_session) return JSON.stringify(cached_session)
    let session = null
    let session_csrf = null
    const csrf_exists = getCSRF() ?? {}

    if (!csrf_exists.token) {
      const csrf_new = setCSRF()
      try {
        session_csrf = fetch('/supakitCSRF', {
          method: 'POST',
          body: JSON.stringify(csrf_new)
        }).then(() => {
          try {
            const csrf = getCSRF()
            session = fetch('/supakit', {
              method: 'GET',
              headers: {
                'x-csrf-token': csrf.token,
                'x-csrf-name': csrf.name
              }
            }).then(async (res) => {
              const json = res.body ? await res.json() : { session: null }
              return json.session
            })
          } catch (err: any) {
            return null
          }
          return session
        })
        return session_csrf
      } catch (err: any) {
        return null
      }
    } else {
      try {
        const csrf = getCSRF()
        session = fetch('/supakit', {
          method: 'GET',
          headers: {
            'x-csrf-token': csrf.token,
            'x-csrf-name': csrf.name
          }
        }).then(async (res) => {
          const json = res.body ? await res.json() : { session: null }
          return json.session
        })
      } catch (err: any) {
        return null
      }
      return session
    }
  },
  setItem(key, value) {
    if (!browser()) return
    cached_session = JSON.parse(value)
    const csrf = getCSRF()
    try {
      fetch('/supakit', {
        method: 'POST',
        body: value,
        headers: {
          'x-csrf-token': csrf.token,
          'x-csrf-name': csrf.name
        }
      })
    } catch (err: any) {
      return
    }
  },
  removeItem(key) {
    if (!browser()) return
    cached_session = null
    const csrf = getCSRF()
    try {
      fetch('/supakit', {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrf.token,
          'x-csrf-name': csrf.name
        }
      })
    } catch (err: any) {
      return
    }
  }
}
