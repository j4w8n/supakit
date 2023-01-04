import type { Config } from "@sveltejs/kit"

declare module '$supakit/config' {
  export const config: Config
}
