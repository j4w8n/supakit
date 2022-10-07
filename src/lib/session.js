import { error } from '@sveltejs/kit'
import { setContext, getContext } from 'svelte'
import { writable } from 'svelte/store'
import { supabaseClient, createSupabaseServerClient } from './db'
import { config } from '$supakit/config'

const keys = { session: Symbol() }
const cookieList = ['sb-user','sb-access-token','sb-provider-token','sb-refresh-token']

export const initSession = () => {
  if (config.supakit.sessionStore) {
    return setContext(keys.session, { 
      /** @type {import('svelte/store').Writable<import('@supabase/supabase-js').User>} */
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
 * @param {(StateChangeReturn: object) => void} callback
 */
export const startSupabase = (store, callback) => {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED') console.log('refreshed!', session)
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
    if (event === 'SIGNED_OUT') {
      await setCookie('DELETE')
      if (store) store.set(null)
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      await setCookie('POST', JSON.stringify(session))
      if (store) store.set(session?.user || null)
    }

    callback({event, session})
  })
}

/**
 * 
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export const setCookies = async ({ cookies, request }) => {
  const session = request.body ? await request.json() : null
  if (session) {
    cookies.set('sb-user', JSON.stringify(session.user), config.supakit.cookie.options)
    cookies.set('sb-access-token', JSON.stringify(session.access_token), config.supakit.cookie.options)
    cookies.set('sb-provider-token', JSON.stringify(session.provider_token), config.supakit.cookie.options)
    cookies.set('sb-refresh-token', JSON.stringify(session.refresh_token), config.supakit.cookie.options)
    return new Response (null)
  } else {
    return new Response('Expecting JSON body, but body was null.', { status: 400 })
  }
}

/**
 * 
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export const deleteCookies = ({ cookies }) => {
  cookieList.forEach(cookie => cookies.delete(cookie, config.supakit.cookie.options))
  return new Response (null, { status: 204 })
}

/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const setSessionLocals = async ({ event, resolve }) => {  
  /** 
   * @type {{[key: string]: any}}
   */
  let cookies = {}

  cookieList.forEach(cookie => {
    cookies[cookie] = event.cookies.get(cookie) ? JSON.parse(event.cookies.get(cookie) || '') : null
  })

  if (cookies['sb-access-token']) createSupabaseServerClient(cookies['sb-access-token'])
 
  event.locals.session = {
    user: cookies['sb-user'],
    access_token: cookies['sb-access-token'],
    provider_token: cookies['sb-provider-token'],
    refresh_token: cookies['sb-refresh-token']
  }

  const response = await resolve(event)
  return response
}