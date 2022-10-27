/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const locals = async ({ event, resolve }) => {
  const cookieList = ['sb-user','sb-access-token','sb-refresh-token']
  /** 
   * @type {{[key: string]: string}}
   */
  let cookies = {}

  cookieList.forEach(name => {
    cookies[name] = event.cookies.get(name) ? JSON.parse(event.cookies.get(name) || '') : null
  })

  event.locals.session = {
    user: cookies['sb-user'],
    access_token: cookies['sb-access-token'],
    refresh_token: cookies['sb-refresh-token']
  }

  return await resolve(event)
}