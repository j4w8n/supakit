import { setContext, getContext, hasContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'
import type { Session } from '@supabase/supabase-js'

const keys = { session: Symbol() }

const initSession = (): Writable<Session | null> => {
  setContext(keys.session, writable() as Writable<Session | null>)

  return getContext(keys.session)
}

export const getSession = (): Writable<Session | null> => {
  return hasContext(keys.session) ? getContext(keys.session) : initSession()
}
