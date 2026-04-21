import { ProfileForm } from '@/components/account/profile-form'
import { requireVerifiedServerSession, toUserProfile } from '@/lib/auth/server'

export default async function ProfilePage() {
  const session = await requireVerifiedServerSession()

  return <ProfileForm profile={toUserProfile(session)} />
}
