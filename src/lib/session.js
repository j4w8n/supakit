import { error } from '@sveltejs/kit'
import { setContext, getContext } from 'svelte'
import { writable } from 'svelte/store'
import { supabaseClient, createSupabaseServerClient } from './db'
import { merge } from './utils'

const keys = { session: Symbol() }
const cookieList = ['sb-user','sb-access-token','sb-provider-token','sb-refresh-token']

/** 
 * @type {import('./index').Config}
 */
let config = {
  cookieOptions: { maxAge: 7200 },
  sessionStore: false,
  cookieRoute: '/api/supakit'
}

/** 
 * @param {import('./index').Config} config_options
 */
export const setupSupakit = (config_options) => {
  config = merge(config, config_options)
  if (config.sessionStore) {
    return setContext(keys.session, { 
      /** @type {import('svelte/store').Writable<import('@supabase/supabase-js').User>} */
      session: writable() 
    })
  }
}

export const getSession = () => {
  return getContext(keys.session)
}

/**
 * 
 * @param {import('svelte/store').Writable<import('@supabase/supabase-js').User | null>} store 
 * @param {(event: string) => void} callback
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
        await fetch(config.cookieRoute || '', {
          method,
          body
        })
      } catch (/** @type {any} */ err) {
        throw error(500, err)
      }
    }
    if (event === 'SIGNED_OUT') {
      await setCookie('DELETE')
      store.set(null)
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      await setCookie('POST', JSON.stringify(session))
      store.set(session?.user || null)
    }

    callback(event)
  })
}

/**
 * 
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export const setCookies = async ({ cookies, request }) => {
  const session = request.body ? await request.json() : null
  if (session) {
    cookies.set('sb-user', JSON.stringify(session.user), config.cookieOptions)
    cookies.set('sb-access-token', JSON.stringify(session.access_token), config.cookieOptions)
    cookies.set('sb-provider-token', JSON.stringify(session.provider_token), config.cookieOptions)
    cookies.set('sb-refresh-token', JSON.stringify(session.refresh_token), config.cookieOptions)
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
  cookieList.forEach(cookie => cookies.delete(cookie, config.cookieOptions))
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