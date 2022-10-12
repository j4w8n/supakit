import { config } from '$supakit/config'

/**
 * 
 * @type {import('@sveltejs/kit').Handle}
 */
export const cookies = async ({ event, resolve }) => {
  const cookieRoute = config.supakit.cookie.route
  const cookieOptions = config.supakit.cookie.options

  if (event.url.pathname !== cookieRoute) {
    return await resolve(event)
  }

  /**
   * @type {import('@supabase/supabase-js').Session | null}
   */
  const session = event.request.body ? await event.request.json() : null
  const cookies = Object.entries({
    'sb-user': session?.user,
    'sb-access-token': session?.access_token,
    'sb-provider-token': session?.provider_token,
    'sb-refresh-token': session?.refresh_token
  })

  if (event.request.method === 'POST') {
    if (session) {
      const response = new Response(null)
      cookies.forEach(([name, value]) => {
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
    cookies.forEach(([name]) => {
      response.headers.append('set-cookie', event.cookies.serialize(name, '', expireOptions))
    })
    return response
  }

  return await resolve(event)
}