const defaults = {
  supakit: {
    cookie: {
      options: {
        maxAge: 14400
      },
      route: '/api/supakit'
    },
    redirects: {
      login: null,
      logout: null
    }
  }
}

export default defaults
