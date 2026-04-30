import { PageReturnLink } from '@/components/app-shell/page-return-link'
import { ProfileForm } from '@/components/account/profile-form'
import { requireVerifiedServerSession, toUserProfile } from '@/lib/auth/server'

export default async function ProfilePage() {
  const session = await requireVerifiedServerSession()

  return (
    <div className="page-frame flex flex-1 flex-col gap-5 pt-7 md:pt-9">
      <PageReturnLink />
      <ProfileForm profile={toUserProfile(session)} />
    </div>
  )
}
