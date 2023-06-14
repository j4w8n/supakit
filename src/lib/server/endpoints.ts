import { getCookieOptions } from '../config/index.js'
import { json, type Handle, redirect } from "@sveltejs/kit"
import { csrf_check, isAuthToken } from '../utils.js'
import { base } from '$app/paths'

export const endpoints = (async ({ event, resolve }) => {
  const { url, request, cookies } = event
  const cookie_options = getCookieOptions()

  if (url.pathname === `${base}/supakit/callback`) {
    const code = url.searchParams.get('code')
    const next = url.searchParams.get('next') ?? '/'

    if (code) {
      await event.locals.supabase.auth.exchangeCodeForSession(code)
    }

    throw redirect(303, `${base}${next}`)
  }

  if (url.pathname === `${base}/supakit/csrf`) {
    const forbidden = csrf_check(event)
    if (forbidden) return forbidden

    if (request.method === 'POST') {
      const data: { token: string, name: string } = request.body ? await request.json() : {}

      if (!data.token && !data.name) return new Response('Invalid body.', { status: 400 })

      const token = data.token
      const cookie_name = data.name

      const response = new Response(null)
      response.headers.append('set-cookie', cookies.serialize(`sb-${cookie_name}-csrf`, token))
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
