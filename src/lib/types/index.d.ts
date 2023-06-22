import type { AuthChangeEvent, AuthFlowType, Session, SupabaseClient, SupabaseClientOptions, SupportedStorage } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'
import type { Handle } from '@sveltejs/kit'

export type MaybeResponse = void | Response
export type GenericCookieOptions = {[key: string]: any}
export type SecureCookieOptionsPlusName = Omit<CookieSerializeOptions, "httpOnly"> & { name?: string }
export type StateChangeCallback = ({ event, session }: { event: AuthChangeEvent, session: Session | null }) => Promise<type> | void
export function supabaseAuthStateChange(
  client: SupabaseClient,
  store?: Writable<Session | null> | null, 
  callback?: StateChangeCallback
): void
export function getSessionStore(): Writable<Session | null>
export function getCookieOptions(): SecureCookieOptionsPlusName
export function setCookieOptions({}: SecureCookieOptionsPlusName): void

export const CookieStorage: SupportedStorage
export function supakit(event: RequestEvent): Promise<MaybeResponse>
export function supakitLite(event: RequestEvent): Promise<MaybeResponse>

export type SupabaseClientOptionsWithLimitedAuth<SchemaName = 'public'> = Omit<
	SupabaseClientOptions<SchemaName>,
	'auth'
> & {
  auth: {
    flowType: AuthFlowType
  }
}
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
  options?: SupabaseClientOptionsWithLimitedAuth, 
  cookie_options?: SecureCookieOptionsPlusName
): SupabaseClient<Database, SchemaName>
export function createServerClient<
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
  event: RequestEvent,
  options?: SupabaseClientOptionsWithLimitedAuth<SchemaName>,
  cookie_options?: SecureCookieOptionsPlusName
): SupabaseClient<Database, SchemaName>
