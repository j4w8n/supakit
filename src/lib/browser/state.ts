import { supabase } from './client.js'
import type { StateChangeCallback } from '../types/index.js'
import type { Writable } from 'svelte/store'
import type { SupabaseClient, Session } from '@supabase/supabase-js'

export const supabaseAuthStateChange = async (client: SupabaseClient | null = null, store: Writable<Session | null> | null = null, callback: StateChangeCallback | null = null) => {
  const supabaseClient = client ?? supabase
  let cached_session: Session | null = null

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
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

    if (callback) callback({event, session})
  })
}
