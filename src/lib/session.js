import { error } from '@sveltejs/kit'
import { setContext, getContext } from 'svelte'
import { writable } from 'svelte/store'
import { supabaseClient } from './clients'
import { config } from '$supakit/config'

const keys = { session: Symbol() }

export const initSession = () => {
  if (config.supakit.sessionStore) {
    return setContext(keys.session, { 
      /** @type {import('svelte/store').Writable<import('@supabase/supabase-js').User | null>} */
      session: writable() 
    })
  } else {
    throw new Error('To use initSession(), set supakit.sessionStore to true in supakit.config.js')
  }
}

export const getSession = () => {
  if (config.supakit.sessionStore) {
    return getContext(keys.session)
  } else {
    throw new Error('To use getSession(), set supakit.sessionStore to true in supakit.config.js')
  }
}

/**
 * @typedef {Object} StateChangeReturn
 * @property {string} event - A supabase event
 * @property {import('@supabase/supabase-js').Session | null} session - A supabase session
 */

/**
 * @param {import('svelte/store').Writable<import('@supabase/supabase-js').User | null>} store
 * @param {(StateChangeReturn: object) => void | null} callback
 */
export const onAuthStateChange = (store, callback) => {
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
      if (store) store.set(session?.user || null)
    }
    if (event === 'SIGNED_OUT') {
      await setCookie('DELETE')
      if (store) store.set(null)
    }

    callback({event, session})
  })
}