import { supabase } from './client.js'
import { getCookieOptions } from '../config/index.js'
import type { StateChangeCallback } from '../types/index.js'
import type { Writable } from 'svelte/store'
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { serialize } from 'cookie'

export const supabaseAuthStateChange = (client: SupabaseClient | null = null, store: Writable<Session | null> | null = null, callback: StateChangeCallback | null = null) => {
  const supabase_client = client ?? supabase
  let cached_session: Session | null = null

  supabase_client.auth.onAuthStateChange((event, session) => {
    /**
     * If the client is logging in or the page refreshes,
     * set a temp non-httpOnly cookie for use with callback code.
     */
    if (event === 'SIGNED_IN' && cached_session === null) {
      const cookie_options = getCookieOptions()
      document.cookie = serialize('sb-temp-session', JSON.stringify(session), {
        ...cookie_options,
        httpOnly: false,
        maxAge: 5,
        sameSite: 'strict',
        secure: true
      }) 
    }

    /**
     * expires_at check ensures that we don't set cookies unnecessarily;
     * since an INITIAL_SESSION event fires it's own SIGNED_IN event and the session would be the same.
     */
    if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.expires_at !== cached_session?.expires_at)) {
      cached_session = session
      if (store) store.set(session)
    }
    if (event === 'SIGNED_OUT') {
      cached_session = null
      if (store) store.set(null)
    }

    if (callback) {
      callback({event, session})
    }
  })
}
