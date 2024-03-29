import type { AuthChangeEvent, AuthFlowType, Session, SupabaseClient, SupabaseClientOptions, SupportedStorage } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'
import type { Handle } from '@sveltejs/kit'

export type SvelteKitCookieOptions = CookieSerializeOptions & {path: string }
export type SvelteKitCookieOptionsPlusName = SvelteKitCookieOptions & { name?: string }
export type CookieOptions = { cookie_options: SvelteKitCookieOptionsPlusName }
export type CookieOptionTypes = 'session' | 'expire' | 'remember_me' | 'all'
export type KeyStringObjectAny = {[key: string]: any}
export type SupakitRegExp = 'auth_token' | 'code_verifier' | 'csrf' | 'provider_token' | 'remember_me'
export type KeyStringObjectRegExp = { [key: string]: RegExp }
export type SupabaseClientOptionsWithLimitedAuth<SchemaName = 'public'> = Omit<
	SupabaseClientOptions<SchemaName>,
	'auth'
> & {
  auth?: {
    flowType?: AuthFlowType
    debug?: boolean
  }
}
export type StateChangeCallback = ({ event, session }: { event: AuthChangeEvent, session: Session | null }) => Promise<type> | void
export type ServerClientOptions = { 
  cookie_options: SvelteKitCookieOptionsPlusName
  client_options: SupabaseClientOptions<Schema>
}
export type MaybeServerClientOptions = { 
  cookie_options?: SvelteKitCookieOptionsPlusName
  client_options?: SupabaseClientOptionsWithLimitedAuth
}
export type GenericSchema = {
  Tables: Record<string, GenericTable>
  Views: Record<string, GenericView>
  Functions: Record<string, GenericFunction>
}

export const supakit: handle
export const supakitLite: Handle

export function rememberMe() {
  return {
    get value(): boolean;,
    set value(v: boolean): void;,
    get toggle(): boolean;
  }
}
export function supabaseAuthStateChange(
  client: SupabaseClient,
  store?: Writable<Session | null> | null, 
  callback?: StateChangeCallback
): void
export function getSessionStore(): Writable<Session | null>
export function getSupabaseLoadClientCookieOptions(): SvelteKitCookieOptionsPlusName
export function setSupabaseLoadClientCookieOptions({}: SvelteKitCookieOptionsPlusName): void
export function getSupabaseServerClientOptions(): ServerClientOptions
export function setSupabaseServerClientOptions({}: MaybeServerClientOptions): void
export function createSupabaseLoadClient<
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
  session: Session | null,
  options?: SupabaseClientOptionsWithLimitedAuth, 
  cookie_options?: SvelteKitCookieOptionsPlusName
): SupabaseClient<Database, SchemaName, Schema>
