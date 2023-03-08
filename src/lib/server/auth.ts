import { sequence } from "@sveltejs/kit/hooks"
import { cookies } from "./cookies.js"
import { locals } from "./locals.js"

export const supakitAuth = sequence(cookies, locals)