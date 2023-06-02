import { setContext, getContext, hasContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'
import type { Session } from '@supabase/supabase-js'

const keys = { session: Symbol() }

const initSessionStore = (): Writable<Session | null> => {
  setContext(keys.session, writable() as Writable<Session | null>)

  return getContext(keys.session)
}

export const getSessionStore = (): Writable<Session | null> => {
  return hasContext(keys.session) ? getContext(keys.session) : initSessionStore()
}
