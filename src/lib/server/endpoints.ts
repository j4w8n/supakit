import { supabaseConfig, cached_options } from '../config/index.js'
import { json, type Handle, type Cookies } from "@sveltejs/kit"
import { createClient, type EmailOtpType, type Session } from "@supabase/supabase-js"
import { csrfCheck, getCookieOptions, isAuthToken, stringToBoolean, testRegEx } from '../utils.js'
import { base } from '$app/paths'
import { env } from '$env/dynamic/public'
import { CookieStorage } from "./storage.js"
import type { CookieOptions } from 'types/index.js'

export const endpoints = (async ({ event, resolve }) => {
  const { url, request, cookies } = event

  /* Config options are running in memory on the server-side, create a cookie */
  if (cached_options) {
    supabaseConfig({ cookies }).set = cached_options
  }

  const { cookie_options, client_options } = supabaseConfig({ cookies }).get
  const { expire_cookie_options, config_cookie_options, session_cookie_options, remember_me_cookie_options } = getCookieOptions({ options: cookie_options, type: 'all' })
  const supabase = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: new CookieStorage({ cookies, cookie_options }),
      flowType: 'pkce',
      debug: client_options.auth?.debug ?? false,
      ...(client_options.auth?.storageKey ? { storageKey: client_options.auth.storageKey } : {}),
      ...(client_options.auth?.lock ? { lock: client_options.auth.lock } : {})
    }
  })

  const setCookie = (response: Response, cookie: { name: string, value: string }, options: CookieOptions = cookie_options) => {
    response.headers.append('set-cookie', cookies.serialize(cookie.name, cookie.value, options))
  }

  const setReturnCookies = (response: Response, cookies: Cookies, session?: Session | null) => {
    const existing_cookies = cookies.getAll()
    for (const cookie of existing_cookies) {
      if (testRegEx({ string: cookie.name, type: 'code_verifier' }) || testRegEx({ string: cookie.name, type: 'csrf' })) {
        /* expire any existing csrf or code-verifier cookies */
        /**
          * exchangeCodeForSession() won't expire code-verifier cookies correctly because
          * of the custom response and nature of the cookies function.
          */
        setCookie(response, { name: cookie.name, value: '' }, expire_cookie_options)
      } else if (testRegEx({ string: cookie.name, type: 'remember_me' })) {
        /* add remember me cookie */
        setCookie(response, cookie, remember_me_cookie_options)
      } else if (testRegEx({ string: cookie.name, type: 'config' })) {
        /* add config cookie */
        setCookie(response, cookie, config_cookie_options)
      } else {
        /* add all other cookies */
        setCookie(response, cookie)
      }
    }

    if (session) {
      /* set provider cookies, if exist */
      const provider_token: string | null = session?.provider_token ?? null
      const provider_refresh_token: string | null = session?.provider_refresh_token ?? null

      if (provider_token !== null || provider_refresh_token !== null) {
        const remember_me_cookie = cookies.get('supakit-rememberme') ?? 'true'
        const remember_me = stringToBoolean(remember_me_cookie)
        if (provider_token) setCookie(response, { name: 'sb-provider-token', value: JSON.stringify(provider_token) }, remember_me ? cookie_options : session_cookie_options)
        if (provider_refresh_token) setCookie(response, { name: 'sb-provider-refresh-token', value: JSON.stringify(provider_refresh_token) }, remember_me ? cookie_options : session_cookie_options)
      }
    }
  }

  /* Handle request to Supakit's auth code callback route */
  if (url.pathname === `${base}/supakit/callback` && request.method === 'GET') {
    const code = url.searchParams.get('code')

    /* define post-auth redirect */
    const next = url.searchParams.get('next') ?? '/'

    /* setup redirect, with cookies */
    const response = new Response(null, {
      status: 303,
      headers: {
        Location: `${url.origin}${base}${next}`
      }
    })

    if (code) {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error(error)
        throw error
      }

      setReturnCookies(response, cookies, session)
    }
    
    return response
  }

  /* Handle request to Supakit's auth token confirm route */
  if (url.pathname === `${base}/supakit/confirm` && request.method === 'GET') {
    const token_hash = url.searchParams.get('token_hash') ?? ''
    const type = (url.searchParams.get('type') ?? 'email') as EmailOtpType

    /* define post-auth redirect */
    const next = url.searchParams.get('next') ?? '/'

    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type })
      if (error) {
        console.error(error)
        throw error
      }
    }

    /* setup redirect, with cookies */
    const response = new Response(null, {
      status: 303,
      headers: {
        Location: `${url.origin}${base}${next}`
      }
    })

    setReturnCookies(response, cookies)

    return response
  }

  /* Handle request to Supakit's CSRF route */
  if (url.pathname === `${base}/supakit/csrf`) {
    const forbidden = csrfCheck(event)
    if (forbidden) return forbidden

    if (request.method === 'POST') {
      const data: { token: string, name: string } = request.body ? await request.json() : {}

      if (!data.token && !data.name) return new Response('Invalid body.', { status: 400 })

      const token = data.token
      const cookie_name = data.name

      const response = new Response(null)
      setCookie(response, { name: `sb-${cookie_name}-csrf`, value: token }, session_cookie_options)
      return response
    }

    return new Response(null, { status: 401 })
  }
  
  /* Handle request to Supakit's cookie route */
  if (url.pathname === `${base}/supakit/cookie`) {
    const forbidden = csrfCheck(event)
    if (forbidden) return forbidden

    const cookie_name = request.headers.get('x-csrf-name') ?? false
    const cookie = cookies.get(`sb-${cookie_name}-csrf`) ?? false
    const token = request.headers.get('x-csrf-token') ?? false

    if (!cookie || !token) return new Response('No CSRF cookie or token', { status: 401 })
    if (cookie != token) return new Response('CSRF cookie and token do not match', { status: 401 })

    if (request.method === 'GET') {
      const key = request.headers.get('x-storage-key') ?? ''
      const response = json({
        cookie: cookies.get(key) ?? null
      })

      return response
    }

    if (request.method === 'POST') {
      const cookie: { name: string, value: string } = request.body ? await request.json() : null
      if (cookie) {
        const response = new Response(null)
        const data = JSON.parse(cookie.value) ?? cookie.value
        const remember_me_cookie = cookies.get('supakit-rememberme') ?? 'true'
        const remember_me = stringToBoolean(remember_me_cookie)

        if (cookie.name === client_options.auth?.storageKey || isAuthToken(cookie.name)) {
          setCookie(response, cookie, remember_me ? cookie_options : session_cookie_options)
          if (data.provider_token && data.provider_token !== '') setCookie(response, { name: 'sb-provider-token', value: JSON.stringify(data.provider_token) }, remember_me ? cookie_options: session_cookie_options)
          if (data.provider_refresh_token && data.provider_refresh_token !== '') setCookie(response, { name: 'sb-provider-refresh-token', value: JSON.stringify(data.provider_refresh_token) }, remember_me ? cookie_options: session_cookie_options)
        } else if (testRegEx({ string: cookie.name, type: 'remember_me' })) {
          /* add remember me cookie */
          setCookie(response, cookie, remember_me_cookie_options)
        } else {
          /* add all other cookies */
          setCookie(response, cookie)
        }

        return response
      } else {
        return new Response('Invalid body.', { status: 400 })
      }
    } 
    
    if (request.method === 'DELETE') {
      const cookie: { name: string, value: string } = request.body ? await request.json() : null
      const response = new Response(null, { status: 204 })

      setCookie(response, cookie, expire_cookie_options)
      if (cookie.name === client_options.auth?.storageKey || isAuthToken(cookie.name)) {
        if (cookies.get('sb-provider-token')) setCookie(response, { name: 'sb-provider-token', value: '' }, expire_cookie_options)
        if (cookies.get('sb-provider-refresh-token')) setCookie(response, { name: 'sb-provider-refresh-token', value: '' }, expire_cookie_options)
      }
      
      return response
    }

    return new Response(null, { status: 401 })
  }

  /* Handle request to Supakit's config route */
  if (url.pathname === `${base}/supakit/config` && request.method === 'GET') return json({ client_options, cookie_options })
  
  return await resolve(event)
}) satisfies Handle
