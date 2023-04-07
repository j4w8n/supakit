import type { AuthChangeEvent, Session, SupabaseClient, SupportedStorage } from '@supabase/supabase-js'
import type { Writable } from 'svelte/store'
import type { CookieSerializeOptions } from 'cookie'
import type { Handle } from '@sveltejs/kit'

export type CookieOptions = {[key: string]: any}
export type SecureCookieOptions = Omit<CookieSerializeOptions, "httpOnly">
export type StateChangeCallback = ({ event, session }: { event: AuthChangeEvent, session: Session | null }) => void

export function supakit(): Handle
export function supakitLite(): Handle
export function supabaseAuthStateChange(
  client?: SupabaseClient | null,
  store?: Writable<Session | null> | null, 
  callback?: ({ event, session }: { event: AuthChangeEvent, session: Session | null }) => void | null
): void
export function getSession(): Writable<Session | null>
export function getCookieOptions(): CookieSerializeOptions
export function setCookieOptions({}: CookieSerializeOptions): void

export const CookieStorage: SupportedStorage
export const supabase: SupabaseClient