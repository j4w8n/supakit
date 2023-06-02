import type { AuthChangeEvent, AuthFlowType, Session, SupabaseClient, SupabaseClientOptions, SupportedStorage } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'
import type { Handle } from '@sveltejs/kit'

export type CookieOptions = {[key: string]: any}
export type SecureCookieOptions = Omit<CookieSerializeOptions, "httpOnly">
export type StateChangeCallback = ({ event, session }: { event: AuthChangeEvent, session: Session | null }) => Promise<type> | void
export function supabaseAuthStateChange(
  client: SupabaseClient,
  store?: Writable<Session | null> | null, 
  callback?: StateChangeCallback
): void
export function getSessionStore(): Writable<Session | null>
export function getCookieOptions(): CookieSerializeOptions
export function setCookieOptions({}: CookieSerializeOptions): void

export const CookieStorage: SupportedStorage
export const supakit: Handle
export const supakitLite: Handle

/* from @supabase/supabase-js */
export type SupabaseClientOptionsWithoutAuth<SchemaName = 'public'> = Omit<
	SupabaseClientOptions<SchemaName>,
	'auth'
>
export type GenericSchema = {
  Tables: Record<string, GenericTable>
  Views: Record<string, GenericView>
  Functions: Record<string, GenericFunction>
}
export function createBrowserClient<
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
  options?: SupabaseClientOptionsWithoutAuth & {
    auth?: {
      storage?: SupportedStorage;
      storageKey?: string;
    }
  }, 
  cookie_options?: SecureCookieOptions): SupabaseClient<Database, SchemaName>
