import { getCookieOptions } from '../config/index.js'
import type { Session } from '@supabase/supabase-js'
import { json, type Handle } from "@sveltejs/kit"
import { csrf_check } from '../utils.js'

export const cookies = (async ({ event, resolve }) => {
  const { url, request, cookies } = event
  const cookie_options = getCookieOptions()

  if (url.pathname === '/supakitCSRF' && request.method === 'POST') {
    const forbidden = csrf_check(event)
    if (forbidden) return forbidden

    const data: { token: string, name: string } = request.body ? await request.json() : {}

    if (!data.token || !data.name) return new Response('Invalid body.', { status: 400 })

    const token = data.token
    const cookie = data.name

    if (token) {
      const response = new Response(null)
      response.headers.append('set-cookie', cookies.serialize(`sb-${cookie}-csrf`, token))
      return response
    }

    return new Response(null, { status: 401 })
  }
  
  /* Handle request to Supakit's cookie route */
  if (url.pathname === '/supakit') {
    const forbidden = csrf_check(event)
    if (forbidden) return forbidden

    const cookieName = request.headers.get('x-csrf-name') ?? false
    const cookie = cookies.get(`sb-${cookieName}-csrf`) ?? false
    const token = request.headers.get('x-csrf-token') ?? false

    if (!cookie || !token) return new Response(null, { status: 401 })
    if (cookie != token) return new Response(null, { status: 401 })

    if (request.method === 'GET') {
      const response = json({
        session: cookies.get('sb-session') ?? null
      })

      return response
    }

    if (request.method === 'POST') {
      const session: Session | null = request.body ? await request.json() : null

      if (session) {
        const response = new Response(null)

        response.headers.append('set-cookie', cookies.serialize('sb-session', JSON.stringify(session), cookie_options))
        if (session.provider_token) response.headers.append('set-cookie', cookies.serialize('sb-provider-token', JSON.stringify(session.provider_token), cookie_options))
        if (session.provider_refresh_token) response.headers.append('set-cookie', cookies.serialize('sb-provider-refresh-token', JSON.stringify(session.provider_refresh_token), cookie_options))
        
        return response
      } else {
        return new Response('Invalid body.', { status: 400 })
      }
    } 
    
    if (request.method === 'DELETE') {
      const expire_options = {
        ...cookie_options,
        maxAge: -1
      }
      const response = new Response(null, { status: 204 })

      response.headers.append('set-cookie', cookies.serialize('sb-session', '', expire_options))
      if (cookies.get('sb-provider-token')) response.headers.append('set-cookie', cookies.serialize('sb-provider-token', '', expire_options))
      if (cookies.get('sb-provider-refresh-token')) response.headers.append('set-cookie', cookies.serialize('sb-provider-refresh-token', '', expire_options))
      
      return response
    }
  }

  return await resolve(event)
}) satisfies Handle
