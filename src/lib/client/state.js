import { error } from '@sveltejs/kit'
import { supabaseClient } from './client'
import { config } from '$supakit/config'
import { goto } from '$app/navigation'

/**
 * 
 * @type {import('../types').StateChange}
 */
export const state = (store = null, callback = null) => {
  const loginRedirect = config.supakit.redirects.login
  const logoutRedirect = config.supakit.redirects.logout

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    /**
     * 
     * @param {string} method 
     * @param {string | null } body 
     */
    const setCookie = async (method, body = null) => {
      try {
        await fetch(config.supakit.cookie.route || '', {
          method,
          body
        })
      } catch (/** @type {any} */ err) {
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

    /**
     * 
     * @type {import('../types').StateChangeCallback}
     */
    if (callback) callback({event, session})
  })
}
