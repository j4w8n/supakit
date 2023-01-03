import { setContext, getContext, hasContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'
import type { User } from '@supabase/supabase-js'

const keys = { session: Symbol() }

const initSession = () => {
  setContext(keys.session, { 
    session: writable() as Writable<User|null>
  })

  return getContext(keys.session)
}

export const getSession = () => {
  return hasContext(keys.session) ? getContext(keys.session) : initSession()
}
