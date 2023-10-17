import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CookieStorage } from './storage.js'
import type { Fetch, GenericSchema, SupabaseClientOptionsWithLimitedAuth } from '../types/index.js'
import { browserEnv } from '../utils.js'
import { supabaseConfig } from '../config/index.js'

let cached_browser_client: SupabaseClient<any, string, any> | undefined

/* mostly from @supabase/supabase-js */
export const createSupabaseLoadClient = async <
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
  fetch: Fetch
): Promise<SupabaseClient<Database, SchemaName, Schema>> => {
  const browser_env = browserEnv()
  let client_options: SupabaseClientOptionsWithLimitedAuth<SchemaName>

  if (browser_env) {
    if (cached_browser_client) {
      return cached_browser_client as SupabaseClient<Database, SchemaName, Schema>
    }
    client_options = supabaseConfig().get.client_options
  } else {
    const config = await fetch('/supakit/config')
    client_options = await config.json()
  }

  const client = createClient<Database, SchemaName, Schema>(supabase_url, supabase_key, {
    ...client_options,
    auth: {
      autoRefreshToken: browser_env,
      detectSessionInUrl: browser_env,
      persistSession: true,
      storage: CookieStorage,
      flowType: client_options.auth?.flowType ?? 'pkce',
      debug: client_options.auth?.debug ?? false,
      ...(client_options.auth?.storageKey ? { storageKey: client_options.auth.storageKey } : {}),
      ...(client_options.auth?.lock ? { lock: client_options.auth.lock } : {})
    }
  })

  if (browser_env) cached_browser_client = client

  return client
}
