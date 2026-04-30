export type UserRole = 'owner' | 'user'

export interface AuthenticatedAppSession {
  session: {
    expiresAt: Date
    id: string
    token: string
    userId: string
  }
  user: {
    email: string
    emailVerified: boolean
    id: string
    image?: string | null
    name: string
    role: UserRole
  }
}

export interface UserProfile {
  displayName: string
  email: string
  emailVerified: boolean
  id: string
  image?: string | null
  initials: string
  role: UserRole
}
