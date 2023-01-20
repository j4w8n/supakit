import { getConfig } from '../config/index.js'
import { error } from '@sveltejs/kit'
import { supabaseBrowserClient } from './client.js'
import { goto } from '$app/navigation'
import type { StateChangeCallback } from 'supakit'
import type { Writable } from 'svelte/store'

export const supabaseAuthStateChange = async (store: Writable<any> | null = null, callback: StateChangeCallback | null = null) => {
  const config = await getConfig()
  const login_redirect = config.supakit.redirects.login
  const logout_redirect = config.supakit.redirects.logout

  supabaseBrowserClient.auth.onAuthStateChange(async (event, session) => {
    const setCookie = async (method: string, body: string | null = null) => {
      try {
        await fetch(config.supakit.cookie.route, {
          method,
          body
        })
      } catch (err: any) {
        throw error(500, err)
      }
    }
    if (event === 'SIGNED_IN') {
      await setCookie('POST', JSON.stringify(session))
      if (store && session) store.set(session.user)
      if (login_redirect) goto(login_redirect)
    }
    if (event === 'SIGNED_OUT') {
      await setCookie('DELETE')
      if (store) store.set(null)
      if (logout_redirect) goto(logout_redirect)
    }
    if (event === 'TOKEN_REFRESHED') {
      await setCookie('POST', JSON.stringify(session))
      if (store && session) store.set(session.user)
    }

    if (callback) callback({event, session})
  })
}
