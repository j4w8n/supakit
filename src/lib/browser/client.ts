import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CookieStorage } from './storage.js'
import { setCookieOptions } from '../config/index.js'
import type { SupabaseClientOptionsWithOnlyAuthFlowType, SecureCookieOptions } from '../types/index.js'

export const createBrowserClient = <
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database
>(supabaseUrl: string, supabaseKey: string, options?: SupabaseClientOptionsWithOnlyAuthFlowType, cookie_options?: SecureCookieOptions): SupabaseClient<Database, SchemaName> => {
  if (cookie_options) setCookieOptions(cookie_options)
  const client = createClient<Database, SchemaName>(supabaseUrl, supabaseKey, {
    ...options,
    global: {
      ...options?.global,
      headers: {
        ...options?.global?.headers,
        'X-Client-Info': 'supakit@v1.0.0-next.114'
      }
    },
    auth: {
      storage: CookieStorage
    }
  })
  return client
}