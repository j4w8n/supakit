import { getSupabaseServerClientOptions } from '../config/index.js'
import { json, type Handle } from "@sveltejs/kit"
import { createClient, type EmailOtpType } from "@supabase/supabase-js"
import { csrf_check, isAuthToken } from '../utils.js'
import { base } from '$app/paths'
import { env } from '$env/dynamic/public'
import { CookieStorage } from "./storage.js"

export const endpoints = (async ({ event, resolve }) => {
  const { url, request, cookies } = event
  const { cookie_options } = getSupabaseServerClientOptions()

  /* Handle request to Supakit's auth code callback route */
  if (url.pathname === `${base}/supakit/callback` && request.method === 'GET') {
    const code = url.searchParams.get('code')

    /* define post-auth redirect */
    const next = url.searchParams.get('next') ?? '/'

    const supabase = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: new CookieStorage({ cookies, cookie_options }),
        flowType: 'pkce',
        ...(cookie_options?.name ? { storageKey: cookie_options.name } : {})
      }
    })

    /* setup redirect, with cookies */
    const response = new Response(null, {
      status: 303,
      headers: {
        Location: `${url.origin}${base}${next}`
      }
    })
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error(error)
        throw error
      }
      const existing_cookies = cookies.getAll()
      const code_verifier_cookie_regex = /^.*-code-verifier$/
      const csrf_cookie_regex = /^.*-csrf$/
      const provider_token: string | null = data.session?.provider_token ?? null
      const provider_refresh_token: string | null = data.session?.provider_refresh_token ?? null
      const expire_options = {
        ...cookie_options,
        maxAge: -1
      }

      for (const cookie of existing_cookies) {
        if (code_verifier_cookie_regex.test(cookie.name) || csrf_cookie_regex.test(cookie.name)) {
          /* expire any existing csrf or code-verifier cookies */
          /**
            * exchangeCodeForSession() won't expire code-verifier cookies correctly because
            * of the custom response and nature of the cookies function.
            */
          response.headers.append('set-cookie', cookies.serialize(cookie.name, cookie.value, expire_options))
        } else {
          /* add all other cookies */
          response.headers.append('set-cookie', cookies.serialize(cookie.name, cookie.value, cookie_options))
        }
      }

      /* set provider cookies, if exist */
      if (provider_token) response.headers.append('set-cookie', cookies.serialize('sb-provider-token', JSON.stringify(provider_token), cookie_options))
      if (provider_refresh_token) response.headers.append('set-cookie', cookies.serialize('sb-provider-refresh-token', JSON.stringify(provider_refresh_token), cookie_options))
    }

    return response
  }

  /* Handle request to Supakit's auth token confirm route */
  if (url.pathname === `${base}/supakit/confirm` && request.method === 'GET') {
    const token_hash = url.searchParams.get('token_hash') ?? ''
    const type = (url.searchParams.get('type') ?? 'email') as EmailOtpType

    /* define post-auth redirect */
    const next = url.searchParams.get('next') ?? '/'

    const supabase = createClient(env.PUBLIC_SUPABASE_URL || '', env.PUBLIC_SUPABASE_ANON_KEY || '', {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: new CookieStorage({ cookies, cookie_options }),
        flowType: 'pkce',
        ...(cookie_options?.name ? { storageKey: cookie_options.name } : {})
      }
    })

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

    const existing_cookies = cookies.getAll()
    const code_verifier_cookie_regex = /^.*-code-verifier$/
    const csrf_cookie_regex = /^.*-csrf$/
    const expire_options = {
      ...cookie_options,
      maxAge: -1
    }

    for (const cookie of existing_cookies) {
      if (code_verifier_cookie_regex.test(cookie.name) || csrf_cookie_regex.test(cookie.name)) {
        /* expire any existing csrf or code-verifier cookies */
        response.headers.append('set-cookie', cookies.serialize(cookie.name, '', expire_options))
      } else {
        /* add all other cookies */
        response.headers.append('set-cookie', cookies.serialize(cookie.name, cookie.value, cookie_options))
      }
    }

    return response
  }

  /* Handle request to Supakit's CSRF route */
  if (url.pathname === `${base}/supakit/csrf`) {
    const forbidden = csrf_check(event)
    if (forbidden) return forbidden

    if (request.method === 'POST') {
      const data: { token: string, name: string } = request.body ? await request.json() : {}

      if (!data.token && !data.name) return new Response('Invalid body.', { status: 400 })

      const token = data.token
      const cookie_name = data.name
      //@ts-ignore
      const { maxAge, expires, name, ...options } = cookie_options

      const response = new Response(null)
      response.headers.append('set-cookie', cookies.serialize(`sb-${cookie_name}-csrf`, token, options))
      return response
    }

    return new Response(null, { status: 401 })
  }
  
  /* Handle request to Supakit's cookie route */
  if (url.pathname === `${base}/supakit/cookie`) {
    const forbidden = csrf_check(event)
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
      const body = request.body ? await request.json() : null
      if (body) {
        const response = new Response(null)
        const data = JSON.parse(body.value) ?? body.value

        response.headers.append('set-cookie', cookies.serialize(body.key, body.value, cookie_options))
        if (data.provider_token && data.provider_token !== '') response.headers.append('set-cookie', cookies.serialize('sb-provider-token', JSON.stringify(data.provider_token), cookie_options))
        if (data.provider_refresh_token && data.provider_refresh_token !== '') response.headers.append('set-cookie', cookies.serialize('sb-provider-refresh-token', JSON.stringify(data.provider_refresh_token), cookie_options))
        
        return response
      } else {
        return new Response('Invalid body.', { status: 400 })
      }
    } 
    
    if (request.method === 'DELETE') {
      const body = request.body ? await request.json() : null
      const expire_options = {
        ...cookie_options,
        maxAge: -1
      }
      const response = new Response(null, { status: 204 })

      response.headers.append('set-cookie', cookies.serialize(body.key, '', expire_options))
      if (isAuthToken(body.key)) {
        if (cookies.get('sb-provider-token')) response.headers.append('set-cookie', cookies.serialize('sb-provider-token', '', expire_options))
        if (cookies.get('sb-provider-refresh-token')) response.headers.append('set-cookie', cookies.serialize('sb-provider-refresh-token', '', expire_options))
      }
      
      return response
    }

    return new Response(null, { status: 401 })
  }

  return await resolve(event)
}) satisfies Handle
