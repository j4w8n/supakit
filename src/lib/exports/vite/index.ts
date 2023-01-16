import { getConfig } from '../../config/index.js'
import type { Plugin } from 'vite'

export function supakit(): Plugin {
  return {
    name: 'rollup-plugin-supakit',

    resolveId(id: string) {
			// treat $supakit/config as virtual
			if (id === '$supakit/config') return `\0${id}`
		},

    async load(id: string) {
      const config = await getConfig()
			if (id === '\0$supakit/config') {
        return `export const config = ${JSON.stringify(config)}`
      }
		}
  }
}
