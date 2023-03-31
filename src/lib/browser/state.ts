import { error } from '@sveltejs/kit'
import { supabase } from './client.js'
import type { StateChangeCallback } from 'supakit'
import type { Writable } from 'svelte/store'
import type { SupabaseClient, Session } from '@supabase/supabase-js'

export const supabaseAuthStateChange = async (client: SupabaseClient | null = null, store: Writable<Session | null> | null = null, callback: StateChangeCallback | null = null) => {
  const supabaseClient = client ?? supabase
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    const setCookie = async (method: string, body: string | null = null) => {
      try {
        await fetch('/supakit', {
          method,
          body
        })
      } catch (err: any) {
        throw error(500, err)
      }
    }
    const { data } = await supabaseClient.auth.getSession()

    /**
     * extra expires_at checks ensure that we don't set cookies when calling setSession(session) below;
     * since that call fires it's own SIGNED_IN event and the session would be the same.
     */
    if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || (event === 'SIGNED_IN' && session?.expires_at !== data.session?.expires_at)) {
      await setCookie('POST', JSON.stringify(session))
      if (store) store.set(session)
    }
    if (event === 'SIGNED_OUT') {
      await setCookie('DELETE')
      if (store) store.set(null)
    }
    if (event === 'INITIAL_SESSION' && session) await supabaseClient.auth.setSession(session)

    if (callback) callback({event, session})
  })
}
