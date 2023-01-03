import { setContext, getContext, hasContext } from 'svelte'
import { writable } from 'svelte/store'

const keys = { session: Symbol() }

const initSession = () => {
  setContext(keys.session, { 
    /** @type {import('svelte/store').Writable<import('@supabase/supabase-js').User | null>} */
    session: writable() 
  })

  return getContext(keys.session)
}

export const getSession = () => {
  return hasContext(keys.session) ? getContext(keys.session) : initSession()
}
