import { supabaseClient } from '../clients'
import { decode } from '../utils'
import { config } from '$supakit/config'

/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const locals = async ({ event, resolve }) => {
  const cookieList = ['sb-user','sb-access-token','sb-provider-token','sb-refresh-token']
  /** 
   * @type {{[key: string]: any}}
   */
  let cookies = {}

  for (let i = 0; i < cookieList.length; i++) {
    cookies[cookieList[i]] = event.cookies.get(cookieList[i]) ? JSON.parse(event.cookies.get(cookieList[i]) || '') : null
  }

  const setLocals = () => {
    event.locals.session = {
      user: cookies['sb-user'],
      access_token: cookies['sb-access-token'],
      provider_token: cookies['sb-provider-token'],
      refresh_token: cookies['sb-refresh-token']
    }
  }

  const access_token = cookies['sb-access-token']
  const refresh_token = cookies['sb-refresh-token']

  if (access_token) {
    const jwt = decode(access_token)
    const expires = jwt.exp - (Date.now() / 1000)

    if (expires < 1) {
      try {
        const { data, error } = await supabaseClient.auth.setSession({access_token, refresh_token})
        if (error) console.error(error)
        if (data.session) {
          const refreshCookies = Object.entries({
            'sb-user': data.session.user,
            'sb-access-token': data.session.access_token,
            'sb-refresh-token': data.session.refresh_token
          })

          refreshCookies.forEach(([name, value]) => {
            event.cookies.set(name, JSON.stringify(value), config.supakit.cookie.options)
          })
          event.locals.session = {
            user: data.session?.user,
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token
          }
        } else { setLocals() }
      } catch (err) {
        console.error(err)
      }
    } else { setLocals() }
  } else { setLocals() }

  return await resolve(event)
}