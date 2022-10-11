import { createSupabaseServerClient, supabaseClient } from '../clients'
import { decode } from '../utils'

/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const client = async ({ event, resolve }) => {
  const token = event.locals.session.access_token
  if (token) createSupabaseServerClient(token)

  if (token) {
    const jwt = decode(token)
    const expires = jwt.exp - (Date.now() / 1000)
    console.log('expires', expires)
    if (expires < 3480) {
      const { error } = await supabaseClient.auth.setSession(event.locals.session.refresh_token)
      if (error) console.error(error)
    }
  }

  return await resolve(event)
}