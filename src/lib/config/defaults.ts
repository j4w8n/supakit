const defaults = {
  supakit: {
    cookie: {
      options: {
        maxAge: 14400
      },
      route: '/api/supakit'
    },
    redirects: {
      login: '',
      logout: ''
    }
  }
}

export default defaults
