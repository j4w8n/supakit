import { sequence } from "@sveltejs/kit/hooks"
import { endpoints } from "./endpoints.js"
import { locals } from "./locals.js"

export const supakit = sequence(endpoints, locals)
export const supakitLite = endpoints
