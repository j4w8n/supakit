import { supabase } from './client.js'
import type { StateChangeCallback } from '../types/index.js'
import type { Writable } from 'svelte/store'
import type { SupabaseClient, Session } from '@supabase/supabase-js'

export const supabaseAuthStateChange = (client: SupabaseClient | null = null, store: Writable<Session | null> | null = null, callback: StateChangeCallback | null = null) => {
  const supabase_client = client ?? supabase
  let cached_session: Session | null = null

  supabase_client.auth.onAuthStateChange((event, session) => {
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
      /**
       * Ensure cookies are set/expired before callback code runs.
       */
      const wait = new Promise(( resolve, reject ) => {
        setTimeout(() => { resolve('cookie') }, 100)
      })
      wait.then(() => callback({event, session}))
    }
  })
}
