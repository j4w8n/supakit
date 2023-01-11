import type { Handle } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"
import { cookies } from "./cookies"
import { client } from "./client"
import { locals } from "./locals"

export const auth = (sequence(cookies, locals, client)) satisfies Handle
