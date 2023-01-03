import type { Handle } from "@sveltejs/kit"

export const locals = (async ({ event, resolve }) => {
  const cookieList = ['sb-user','sb-access-token','sb-refresh-token']
  let cookies: { [key: string]: string } = {}

  cookieList.forEach(name => {
    cookies[name] = event.cookies.get(name) ? JSON.parse(event.cookies.get(name) || '') : null
  })

  event.locals.session = {
    user: cookies['sb-user'],
    access_token: cookies['sb-access-token'],
    refresh_token: cookies['sb-refresh-token']
  }

  return await resolve(event)
}) satisfies Handle
