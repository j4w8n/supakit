import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CookieStorage } from './storage.js'
import { setSupabaseLoadClientCookieOptions } from '../config/index.js'
import type { SupabaseClientOptionsWithLimitedAuth, SecureCookieOptionsPlusName, GenericSchema } from '../types/index.js'
import { browserEnv } from '../utils.js'

let cached_browser_client: SupabaseClient<any, string, any> | undefined

/* mostly from @supabase/supabase-js */
export const createSupabaseLoadClient = <
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database,
  Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
    ? Database[SchemaName]
    : any
>(
  supabase_url: string,
  supabase_key: string,
  options?: SupabaseClientOptionsWithLimitedAuth<SchemaName>,
  cookie_options?: SecureCookieOptionsPlusName
): SupabaseClient<Database, SchemaName, Schema> => {
  const browser_env = browserEnv()
  if (browser_env && cached_browser_client) {
    return cached_browser_client as SupabaseClient<Database, SchemaName, Schema>
  }

  const client = createClient<Database, SchemaName, Schema>(supabase_url, supabase_key, {
    ...options,
    auth: {
      autoRefreshToken: browser_env,
      detectSessionInUrl: browser_env,
      persistSession: true,
      storage: CookieStorage,
      flowType: options?.auth?.flowType ?? 'pkce',
      ...(cookie_options?.name ? { storageKey: cookie_options.name } : {})
    }
  })

  if (browser_env) {
    if (cookie_options) setSupabaseLoadClientCookieOptions(cookie_options)
    cached_browser_client = client
  }

  return client
}
