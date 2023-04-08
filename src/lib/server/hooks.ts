import { sequence } from "@sveltejs/kit/hooks"
import { cookies } from "./cookies.js"
import { locals } from "./locals.js"
import type { Handle } from "@sveltejs/kit"

export const supakit: Handle = sequence(cookies, locals)
export const supakitLite: Handle = cookies