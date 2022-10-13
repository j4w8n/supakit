import { setContext, getContext } from 'svelte'
import { writable } from 'svelte/store'
import { config } from '$supakit/config'

const keys = { session: Symbol() }

export const initStore = () => {
  if (config.supakit.sessionStore) {
    return setContext(keys.session, { 
      /** @type {import('svelte/store').Writable<import('@supabase/supabase-js').User | null>} */
      session: writable() 
    })
  } else {
    throw new Error('To use initSession(), set supakit.sessionStore to true in supakit.config.js')
  }
}

export const getStore = () => {
  if (config.supakit.sessionStore) {
    return getContext(keys.session)
  } else {
    throw new Error('To use getSession(), set supakit.sessionStore to true in supakit.config.js')
  }
}