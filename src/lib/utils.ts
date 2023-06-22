import type { GenericCookieOptions, SecureCookieOptionsPlusName } from './types/index.js'
import { getCookieOptions } from './config/index.js'
import { error, json, text, type RequestEvent } from '@sveltejs/kit'

export const isBrowser = () => typeof document !== 'undefined'

export const isAuthToken = (name: string) => {
  const regex = /^sb-.*-auth-token$/
  return name === getCookieOptions().name || regex.test(name)
}

export const merge = (current: GenericCookieOptions, updates: GenericCookieOptions): SecureCookieOptionsPlusName => {
  if (updates) {
    for (let key of Object.keys(updates)) {
      if (!current.hasOwnProperty(key) || typeof updates[key] !== 'object') current[key] = updates[key];
      else merge(current[key], updates[key]);
    }
  }
  return current
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
const is_content_type = (request: Request, ...types: string[]) => {
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim() ?? ''
	return types.includes(type.toLowerCase())
}
const is_form_content_type = (request: Request) => {
  return is_content_type(
    request,
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  )
}
export const csrf_check = (event: RequestEvent) => {
  const { request, url } = event
  const forbidden = 
    is_form_content_type(request) && 
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
