import { COOKIE_DEFAULTS } from './config/index.js'
import type { CookieOptionTypes, KeyStringObjectAny, KeyStringObjectRegExp, CookieOptions, SupakitRegExp, ReturnCookieOptions } from './types/index.js'
import { error, json, text, type RequestEvent } from '@sveltejs/kit'

let nested_merge_count = 0

const regexs: KeyStringObjectRegExp = {
  code_verifier: /^.*-code-verifier$/,
  config: /^sb-config$/,
  csrf: /^.*-csrf$/,
  remember_me: /^supakit-rememberme$/,
  auth_token: /^sb-.*-auth-token$/,
  provider_token: /^sb-provider.*token$/
}

export const browserEnv = () => typeof document !== 'undefined'

export const getCookieOptions = ({ options, type }: 
  { options: CookieOptions, type: CookieOptionTypes }): ReturnCookieOptions => {
  const remember_me_cookie_options = {
    ...options,
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365 * 100
  }
  const { expires, maxAge, ...session_cookie_options } = options
  const expire_cookie_options = {
    ...options,
    maxAge: -1
  }
  const config_cookie_options = {
    ...options,
    httpOnly: false,
    maxAge: COOKIE_DEFAULTS.maxAge
  }

  switch (type) {
    case 'config':
      return { config_cookie_options }
    case 'expire':
      return { expire_cookie_options }
    case 'remember_me':
      return { remember_me_cookie_options }
    case 'session':
      return { session_cookie_options }
    case 'all':
      return { 
        config_cookie_options,
        expire_cookie_options,
        remember_me_cookie_options,
        session_cookie_options
      }
  }
}

export const testRegEx = ({ string, type }: { string: string, type: SupakitRegExp }) => {
  for (const key in regexs) {
    if (key === type) return regexs[key].test(string)
  }
  return false
}

export const isAuthToken = (cookie_name: string) => {
  return testRegEx({ string: cookie_name, type: 'auth_token' })
}

export const isProviderToken = (cookie_name: string) => {
  return testRegEx({ string: cookie_name, type: 'provider_token' })
}

export const deepCopy = (object: {}): any => {
  return JSON.parse(JSON.stringify(object))
}

export const merge = ({ current, updates }: { current: KeyStringObjectAny, updates: KeyStringObjectAny }): any => {
  let copy = nested_merge_count === 0 ? deepCopy(current) : current
  if (updates) {
    for (let key of Object.keys(updates)) {
      if (!copy.hasOwnProperty(key) || typeof updates[key] !== 'object') {
        copy[key] = updates[key]
      } else {
        nested_merge_count++
        merge({ current: copy[key], updates: updates[key] })
      }
    }
  }

  nested_merge_count = 0
  return copy
}

export const stringToBoolean = (string: string) => {
  switch (string) {
    case 'true':
      return true
    case 'false':
      return false
    default:
      return true
  }
}

export const decodeBase64URL = (value: string): string => {
  const key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let base64 = ''
  let chr1, chr2, chr3
  let enc1, enc2, enc3, enc4
  let i = 0
  value = value.replace('-', '+').replace('_', '/')

  while (i < value.length) {
    enc1 = key.indexOf(value.charAt(i++))
    enc2 = key.indexOf(value.charAt(i++))
    enc3 = key.indexOf(value.charAt(i++))
    enc4 = key.indexOf(value.charAt(i++))
    chr1 = (enc1 << 2) | (enc2 >> 4)
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
    chr3 = ((enc3 & 3) << 6) | enc4
    base64 = base64 + String.fromCharCode(chr1)

    if (enc3 != 64 && chr2 != 0) {
      base64 = base64 + String.fromCharCode(chr2)
    }
    if (enc4 != 64 && chr3 != 0) {
      base64 = base64 + String.fromCharCode(chr3)
    }
  }
  return base64
}

/**
 * CSRF protection, taken from @sveltejs/kit
 */
const isContentType = (request: Request, ...types: string[]) => {
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim() ?? ''
	return types.includes(type.toLowerCase())
}
const isFormContentType = (request: Request) => {
  return isContentType(
    request,
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  )
}
export const csrfCheck = (event: RequestEvent) => {
  const { request, url } = event
  const forbidden = 
    isFormContentType(request) && 
    (request.method === 'POST' || request.method === 'DELETE' || request.method === 'PUT' || request.method === 'PATCH') && 
    request.headers.get('origin') !== url.origin
  if (forbidden) {
    const csrf_error = error(403, `Cross-site ${request.method} form submissions are forbidden`);
    if (request.headers.get('accept') === 'application/json') {
      return json(csrf_error.body, { status: csrf_error.status })
    }
    return text(csrf_error.body.message, { status: csrf_error.status })
  }
  return false
}
