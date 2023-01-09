declare module '$supakit/config' {
	import type { SupakitConfig } from 'supakit'
  /**
   * A function which returns the merged result of the default configuration, 
   * and any user-supplied configuration via `supakit.config.js` in the project's root directory.
   */
  export function getConfig(): SupakitConfig
}

declare module 'supakit/vite' {
	import type { Plugin } from 'vite'

	/**
	 * Returns the Supakit Vite plugin.
	 */
  export function supakit(): Plugin
}

/**
 * Declare typings for SvelteKit's interfaces, within the library
 */
declare global {
	namespace App {
		interface Locals {
			session: {
				user: string | null
				access_token: string | null
				refresh_token: string | null
			}
		}
	}
}