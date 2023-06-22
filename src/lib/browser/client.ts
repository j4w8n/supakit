import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CookieStorage } from './storage.js'
import { setCookieOptions } from '../config/index.js'
import type { SupabaseClientOptionsWithLimitedAuth, SecureCookieOptionsPlusName, GenericSchema } from '../types/index.js'

/* mostly from @supabase/supabase-js */
export const createBrowserClient = <
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database,
  Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
    ? Database[SchemaName]
    : any
>(
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseClientOptionsWithLimitedAuth<SchemaName>,
  cookie_options?: SecureCookieOptionsPlusName
): SupabaseClient<Database, SchemaName> => {
  if (cookie_options) setCookieOptions(cookie_options)
  return createClient<Database, SchemaName, Schema>(supabaseUrl, supabaseKey, {
    ...options,
    auth: {
      storage: CookieStorage,
      flowType: options?.auth.flowType ?? 'pkce',
      ...(cookie_options?.name ? { storageKey: cookie_options.name } : {})
    }
  })
}