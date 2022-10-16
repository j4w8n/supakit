/**
 * 
 * @param {string} token 
 */
 export const decode = (token) => {
  const jwt = token.split('.')[1]
  const buffer = Buffer.from(jwt, 'base64')
  return JSON.parse(buffer.toString())
}

/**
 * 
 * @param {import('@sveltejs/kit').RequestEvent} event 
 * @returns {{[key: string]: string}}
 */
export const getCookies = (event) => {
  const cookieList = ['sb-user','sb-access-token','sb-refresh-token']
  /** 
   * @type {{[key: string]: string}}
   */
  let cookies = {}

  cookieList.forEach(name => {
    cookies[name] = event.cookies.get(name) ? JSON.parse(event.cookies.get(name) || '') : null
  })
  return cookies
}