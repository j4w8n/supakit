import fs from 'fs'
import path from 'path'
import * as url from 'url'
import defaults from './options.js'

/**
 * 
 * @param {*} param0
 * @returns {Promise<import('../types').Config>}
 */
export default async function config({ cwd = process.cwd() } = {}) {
  const config_file = path.join(cwd, 'supakit.config.js')

  if (!fs.existsSync(config_file)) return defaults

  const user_config = await eval(`import(${JSON.stringify(url.pathToFileURL(config_file))})`)

  if (typeof user_config.default !== 'object') throw new Error('supakit.config.js must be an object')

  /**
   * TODO: validate config before returning
   */

  return { ...defaults, ...user_config.default }
}