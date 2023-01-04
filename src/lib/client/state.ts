import { error } from '@sveltejs/kit'
import { supabaseClient } from './client.js'
// @ts-ignore
import { config } from '$supakit/config'
import { goto } from '$app/navigation'
import type { StateChangeCallback } from '../exports'
import type { Writable } from 'svelte/store'

export const state = (store: Writable<any> | null = null, callback: StateChangeCallback | null = null) => {
  const loginRedirect = config.supakit.redirects.login
  const logoutRedirect = config.supakit.redirects.logout

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    const setCookie = async (method: string, body: string | null = null) => {
      try {
        await fetch(config.supakit.cookie.route || '', {
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
      if (loginRedirect) goto(loginRedirect)
    }
    if (event === 'SIGNED_OUT') {
      await setCookie('DELETE')
      if (store) store.set(null)
      if (logoutRedirect) goto(logoutRedirect)
    }
    if (event === 'TOKEN_REFRESHED') {
      await setCookie('POST', JSON.stringify(session))
      if (store && session) store.set(session.user)
    }

    if (callback) callback({event, session})
  })
}
