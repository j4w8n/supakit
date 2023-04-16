import { getCookieOptions } from '../config/index.js'
import type { StateChangeCallback } from '../types/index.js'
import type { Writable } from 'svelte/store'
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { serialize } from 'cookie'

export const supabaseAuthStateChange = (client: SupabaseClient, store: Writable<Session | null> | null = null, callback: StateChangeCallback | null = null) => {
  let cached_expires_at: number | undefined
  let initial = true

  client.auth.onAuthStateChange((event, session) => {  
    /**
     * The context is that someone was already on the page,
     * previously not logged in, but has now logged in.
     * Set a temp non-httpOnly cookie for potential use with any
     * callback code that accesses the server.
     * 
     * A new tab/window or page refresh, when there is an auth cookie, would not trigger here, 
     * because initial would be true in that case; and we don't want to set a temp cookie
     * where there's already a cookie.
     * 
     * SIGNED_IN && !initial covers most logins
     * INITIAL_SESSION && initial covers logins where the page is refreshed
     */
    if (((event === 'SIGNED_IN' && !initial) || (event === 'INITIAL_SESSION' && initial)) && cached_expires_at === undefined && session) {
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
     * The context is that someone has opened a tab/window to the page,
     * or has refreshed the page.
     * First run has happened, so set initial to false.
     */
    if (initial) initial = false

    /**
     * expires_at check ensures that we don't set the store unnecessarily;
     */
    if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.expires_at !== cached_expires_at)) {
      cached_expires_at = session?.expires_at
      if (store) store.set(session)
    }

    if (event === 'SIGNED_OUT') {
      cached_expires_at = undefined
      if (store) store.set(null)
    }

    if (callback) {
      callback({event, session})
    }
  })
}
