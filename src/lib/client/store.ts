import { setContext, getContext, hasContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'
import type { User } from '@supabase/supabase-js'

const keys = { session: Symbol() }

const initSession = (): Writable<User | null> => {
  setContext(keys.session, { 
    session: writable() as Writable<User|null>
  })

  return getContext(keys.session)
}

export const getSession = (): Writable<User | null> => {
  return hasContext(keys.session) ? getContext(keys.session) : initSession()
}
