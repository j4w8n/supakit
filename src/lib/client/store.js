import { setContext, getContext } from 'svelte'
import { writable } from 'svelte/store'

const keys = { session: Symbol() }

export const initStore = () => {
  return setContext(keys.session, { 
    /** @type {import('svelte/store').Writable<import('@supabase/supabase-js').User | null>} */
    session: writable() 
  })
}

export const getStore = () => {
  return getContext(keys.session)
}