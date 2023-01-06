import { sequence } from "@sveltejs/kit/hooks"
import { cookies } from "./cookies.js"
import { client } from "./client.js"
import { locals } from "./locals.js"

export const auth = sequence(cookies, locals, client)
