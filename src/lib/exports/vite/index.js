import { supakitConfig } from '../../config/index.js'

/** @return {import('vite').Plugin} */
export function supakit() {
  return {
    name: 'rollup-plugin-supakit',

    /** @param {string} id */
    resolveId(id) {
			// treat $supakit/config as virtual
			if (id === '$supakit/config') return `\0${id}`
		},

    /** @param {string} id */
    async load(id) {
			if (id === '\0$supakit/config') {
        const config = await supakitConfig()
        return `export const config = ${JSON.stringify(config)}`
      }
		}
  }
}