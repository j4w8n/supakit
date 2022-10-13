import { sequence } from "@sveltejs/kit/hooks"
import { cookies } from "./cookies"
import { client } from "./client"
import { locals } from "./locals"

/**
 * 
 * @type {import('@sveltejs/kit').Handle} 
 */
export const auth = sequence(cookies, locals, client)