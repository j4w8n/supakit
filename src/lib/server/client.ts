import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClientOptionsWithoutAuth } from '../types/index.js'

export const createServerClient = <
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database
>(supabaseUrl: string, supabaseKey: string, options?: SupabaseClientOptionsWithoutAuth<SchemaName>): SupabaseClient<Database, SchemaName> => {
  const client = createClient<Database, SchemaName>(supabaseUrl, supabaseKey, {
    ...options,
    global: {
      ...options?.global,
      headers: {
        ...options?.global?.headers,
        'X-Client-Info': 'supakit@v1.0.0-next.112'
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
  return client
}