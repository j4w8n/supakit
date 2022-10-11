/**
 * 
 * @param {import('./types').Config} current 
 * @param {import('./types').Config} updates 
 * @returns {import('./types').Config}
 */
export const merge = (current, updates) => {
  if (current) {
    for (/** @param {string} key */ let key of Object.keys(updates)) {
      if (!current.hasOwnProperty(key) || typeof updates[key] !== 'object') current[key] = updates[key];
      else merge(current[key], updates[key]);
    }
    return current
  }
  return updates
}

/**
 * 
 * @param {string} token 
 */
export const decode = (token) => {
  const jwt = token.split('.')[1]
  const buffer = Buffer.from(jwt, 'base64')
  return JSON.parse(buffer.toString())
}