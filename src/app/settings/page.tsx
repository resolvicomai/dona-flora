import { SettingsForm } from '@/components/account/settings-form'
import { getUserSettings } from '@/lib/auth/db'
import { requireVerifiedServerSession } from '@/lib/auth/server'

export default async function SettingsPage() {
  const session = await requireVerifiedServerSession()
  const initialSettings = getUserSettings(session.user.id)

  return <SettingsForm initialSettings={initialSettings} />
}
