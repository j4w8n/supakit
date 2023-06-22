import type { MaybeResponse } from "types/index.js"
import { endpoints } from "./endpoints.js"
import { locals } from "./locals.js"
import type { RequestEvent } from "@sveltejs/kit"

export const supakit = async (event: RequestEvent): Promise<MaybeResponse> => {
  const response = await endpoints(event)
  if (response) return response
  await locals(event)
}

export const supakitLite = async (event: RequestEvent): Promise<MaybeResponse> => {
  const response = await endpoints(event)
  if (response) return response
}
