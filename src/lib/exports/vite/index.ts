import { config } from '../../config/index.js'
import type { Plugin } from 'vite'

export function supakit(): Plugin {
  return {
    name: 'rollup-plugin-supakit',

    resolveId(id: string) {
			// treat $supakit/config as virtual
			if (id === '$supakit/config') return `\0${id}`
		},

    async load(id: string) {
			if (id === '\0$supakit/config') {
        const supakitConfig = await config()
        return `export const config = ${JSON.stringify(supakitConfig)}`
      }
		}
  }
}
