import type { AuthChangeEvent, Session, SupabaseClient, SupabaseClientOptions, GoTrueClientOptions } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'
import type { Cookies, Handle } from '@sveltejs/kit'

export type CookieOptionTypes = 'config' | 'session' | 'expire' | 'remember_me' | 'all'
export type KeyStringObjectAny = { [key: string]: any }
export type SupakitRegExp = 'auth_token' | 'config' | 'code_verifier' | 'csrf' | 'provider_token' | 'remember_me'
export type KeyStringObjectRegExp = { [key: string]: RegExp }
export type CookieOptions = Omit<CookieSerializeOptions, 'httpOnly'>
export type ReturnCookieOptions = { 
  config_cookie_options?: CookieOptions,
  expire_cookie_options?: CookieOptions,
  remember_me_cookie_options?: CookieOptions,
  session_cookie_options?: Omit<CookieOptions, 'maxAge' | 'expires'>
}
export type EventCookieOptions = { cookie_options: CookieOptions }
export type Fetch = {
  (input: RequestInfo | URL, init?: RequestInit | undefined): Promise<Response>;
}
export type SupabaseClientOptionsWithLimitedAuth<SchemaName> = Omit<
	SupabaseClientOptions<SchemaName>,
	'auth'
> & {
  auth?: {
    flowType?: GoTrueClientOptions['flowType']
    debug?: GoTrueClientOptions['debug']
    lock?: GoTrueClientOptions['lock']
    storageKey?: GoTrueClientOptions['storageKey']
  }
}
export type StateChangeCallback = ({ event, session }: { event: AuthChangeEvent, session: Session | null }) => Promise<type> | void
export type GenericSchema = {
  Tables: Record<string, GenericTable>
  Views: Record<string, GenericView>
  Functions: Record<string, GenericFunction>
}

export type SupabaseConfig = {
  cookie_options: CookieOptions
  client_options: SupabaseClientOptionsWithLimitedAuth<SchemaName>
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
export function supabaseAuthStateChange({
  client,
  store, 
  callback
}: {
  client: SupabaseClient
  store?: Writable<Session | null>
  callback?: StateChangeCallback
}): void
export function supabaseConfig({ cookies }: { cookies?: Cookies } = {}) {
  return {
    get get(): SupabaseConfig;,
    set set(config: Partial<SupabaseConfig>): void;
  }
}
export function getSessionStore(): Writable<Session | null>
export function createSupabaseLoadClient<
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database,
  Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
    ? Database[SchemaName]
    : any
>({
  supabase_url, 
  supabase_key,
  fetch
}: {
  supabase_url: string
  supabase_key: string
  fetch: Fetch
}): Promise<SupabaseClient<Database, SchemaName, Schema>>
