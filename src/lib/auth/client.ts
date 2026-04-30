'use client'

import { createAuthClient } from 'better-auth/react'

const DEFAULT_APP_BASE_URL = 'http://localhost:3017'

export const authClient = createAuthClient({
  basePath: '/api/auth',
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_BASE_URL),
})
