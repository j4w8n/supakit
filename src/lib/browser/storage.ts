import type { SupportedStorage } from "@supabase/supabase-js"

let token = ''
let name = ''

const getCSRF = () => {
  return { token, name }
}

const setCSRF = () => {
  token = crypto.randomUUID()
  name = crypto.randomUUID()
  return { token, name }
}

export const CookieStorage: SupportedStorage = {
  getItem(key: string) {
    console.log('getting session')
    let session = null
    let sessionCSRF = null
    const csrfExists = getCSRF() ?? {}
    if (!csrfExists.token) {
      const csrfNew = setCSRF()
      try {
        sessionCSRF = fetch('/supakitCSRF', {
          method: 'POST',
          body: JSON.stringify(csrfNew)
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
        return sessionCSRF
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
    console.log('setting session')
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
    console.log('deleting session')
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
