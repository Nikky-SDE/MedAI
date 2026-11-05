'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleReportPublic(reportId: string, currentStatus: boolean) {
  if (!reportId || !/^[0-9a-fA-F-]{36}$/.test(reportId)) {
    throw new Error("Invalid report ID format")
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('reports')
    .update({ is_public: !currentStatus })
    .eq('id', reportId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/report/${reportId}`)
  return !currentStatus
}
