import type { AuthChangeEvent, AuthFlowType, Session, SupabaseClient, SupabaseClientOptions, SupportedStorage } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'
import type { Handle } from '@sveltejs/kit'

export type CookieOptions = {[key: string]: any}
export type SecureCookieOptions = Omit<CookieSerializeOptions, "httpOnly">
export type StateChangeCallback = ({ event, session }: { event: AuthChangeEvent, session: Session | null }) => Promise<type> | void
export type SupabaseClientOptionsWithOnlyAuthFlowType = Omit<SupabaseClientOptions<SchemaName>, 'auth'> & {
  auth?: { flowType?: AuthFlowType }
}
export function createBrowserClient<
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database
>(supabaseUrl: string, supabaseKey: string, options?: SupabaseClientOptionsWithOnlyAuthFlowType): SupabaseClient<Database, SchemaName>
export function supabaseAuthStateChange(
  client: SupabaseClient,
  store?: Writable<Session | null> | null, 
  callback?: StateChangeCallback
): void
export function getSession(): Writable<Session | null>
export function getCookieOptions(): CookieSerializeOptions
export function setCookieOptions({}: CookieSerializeOptions): void

export const CookieStorage: SupportedStorage
export const supakit: Handle
export const supakitLite: Handle
