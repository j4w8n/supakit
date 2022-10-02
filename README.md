# SupaKit

An, in-development, Supabase auth helper for SvelteKit. Not ready for production!

## Caveats

- I've only done basic local tests with OAuth.
- You must provide your own signIn and signOut functions.
- Use the default `PUBLIC_` publicPrefix for environment variables.

## Install

`npm install supakit`

`pnpm add supakit`

`yarn add supakit`


## setupSupakit

Use this function to declare cookie options, your route to cookie handling, and if you want to use our secure session store.

```js
/* src/routes/+layout.svelte

import { setupSupakit, startSupabase } from 'supakit'
```