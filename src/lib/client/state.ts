import { error } from '@sveltejs/kit'
import { supabaseClient } from './client.js'
import type { StateChangeCallback } from 'supakit'
import type { Writable } from 'svelte/store'
import type { SupabaseClient } from '@supabase/supabase-js'

export const supabaseAuthStateChange = async (client: SupabaseClient | null, store: Writable<any> | null = null, callback: StateChangeCallback | null = null) => {
  const supabase = client ?? supabaseClient
  supabase.auth.onAuthStateChange(async (event, session) => {
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
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      await setCookie('POST', JSON.stringify(session))
      if (store && session) store.set(session.user)
    }
    if (event === 'SIGNED_OUT') {
      await setCookie('DELETE')
      if (store) store.set(null)
    }

    if (callback) callback({event, session})
  })
}
