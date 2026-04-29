import { PageReturnLink } from '@/components/app-shell/page-return-link'
import { SettingsForm } from '@/components/account/settings-form'
import { getUserAIProviderSettings, getUserLibrarySettings, getUserSettings } from '@/lib/auth/db'
import { requireVerifiedServerSession } from '@/lib/auth/server'

export default async function SettingsPage() {
  const session = await requireVerifiedServerSession()
  const initialSettings = getUserSettings(session.user.id)
  const initialLibrarySettings = getUserLibrarySettings(session.user.id)
  const initialAIProviderSettings = getUserAIProviderSettings(session.user.id)

  return (
    <div className="page-frame flex flex-1 flex-col gap-5 pt-7 md:pt-9">
      <PageReturnLink />
      <SettingsForm
        initialAIProviderSettings={initialAIProviderSettings}
        initialLibrarySettings={initialLibrarySettings}
        initialSettings={initialSettings}
      />
    </div>
  )
}
