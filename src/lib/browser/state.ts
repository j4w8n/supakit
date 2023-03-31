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
    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
      await setCookie('POST', JSON.stringify(session))
      if (store) store.set(session)
    }
    if (event === 'SIGNED_OUT') {
      await setCookie('DELETE')
      if (store) store.set(null)
    }

    if (callback) callback({event, session})
  })
}