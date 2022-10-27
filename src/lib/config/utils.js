/**
 * 
 * @param {import('../types').Config} current 
 * @param {import('../types').Config} updates 
 * @returns {import('../types').Config}
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
