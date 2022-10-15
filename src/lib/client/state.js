import { error } from '@sveltejs/kit'
import { supabaseClient } from './clients'
import { config } from '$supakit/config'

/**
 * @param {import('svelte/store').Writable<import('@supabase/supabase-js').User | null> | null} store
 * @param {import('../types').StateChangeCallback} callback
 */
export const state = (store, callback = () => {}) => {
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
    }
    if (event === 'SIGNED_OUT') {
      await setCookie('DELETE')
      if (store) store.set(null)
    }

    callback({event, session})
  })
}