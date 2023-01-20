const defaults = {
  supakit: {
    cookie: {
      options: {
        maxAge: 1000 * 60 * 60 * 24 * 365
      },
      route: '/supakit'
    },
    redirects: {
      login: null,
      logout: null
    }
  }
}

export default defaults
