/**
 * 
 * @param {{[key: string]: any}} current 
 * @param {{[key: string]: any}} updates 
 * @returns {import('./index').Config}
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