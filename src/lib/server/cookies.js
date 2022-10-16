import { supabaseClient } from '../client/clients'
import { config } from '$supakit/config'
import { decode, getCookies } from './utils'
import { error } from '@sveltejs/kit'

/**
 * 
 * @type {import('@sveltejs/kit').Handle}
 */
export const cookies = async ({ event, resolve }) => {
  const cookieRoute = config.supakit.cookie.route
  if (event.url.pathname === cookieRoute) {
    /* Handle request to the configured cookie route - /api/supakit by default */

    /**
     * @type {import('@supabase/supabase-js').Session | null}
     */
    const session = event.request.body ? await event.request.json() : null
    const cookiesToSet = Object.entries({
      'sb-user': session?.user,
      'sb-access-token': session?.access_token,
      'sb-provider-refresh-token': session?.provider_refresh_token,
      'sb-provider-token': session?.provider_token,
      'sb-refresh-token': session?.refresh_token
    })
    const cookieOptions = config.supakit.cookie.options

    if (event.request.method === 'POST') {
      if (session) {
        const response = new Response(null)
        cookiesToSet.forEach(([name, value]) => {
          response.headers.append('set-cookie', event.cookies.serialize(name, JSON.stringify(value), cookieOptions))
        })
        return response
      } else {
        return new Response('Expecting JSON body, but body was null.', { status: 400 })
      }
    } else if (event.request.method === 'DELETE') {
      const response = new Response(null, { status: 204 })
      const expireOptions = {
        ...cookieOptions,
        maxAge: -1
      }
      cookiesToSet.forEach(([name]) => {
        response.headers.append('set-cookie', event.cookies.serialize(name, '', expireOptions))
      })
      return response
    }
  }

  /* Check if sb-access-token jwt is expiring soon or has expired. If so, refresh. */
  const cookies = getCookies(event)
  const access_token = cookies['sb-access-token']

  if (access_token) {
    const jwt = decode(access_token)
    const expires = jwt.exp - (Date.now() / 1000)

    if (expires < 120) {
      const refresh_token = cookies['sb-refresh-token']
      try {
        const { data, error: err } = await supabaseClient.auth.setSession({ access_token: "", refresh_token })
        if (err) throw error(500, err)
        if (data.session) {
          const refreshCookies = Object.entries({
            'sb-user': data.session.user,
            'sb-access-token': data.session.access_token,
            'sb-refresh-token': data.session.refresh_token
          })

          refreshCookies.forEach(([name, value]) => {
            event.cookies.set(name, JSON.stringify(value), config.supakit.cookie.options)
          })
        }
      } catch (/** @type {any} */ catchErr) {
        throw error(500, catchErr)
      }
    }
  }

  return await resolve(event)
}