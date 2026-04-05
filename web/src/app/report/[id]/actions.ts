'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleReportPublic(reportId: string, currentStatus: boolean) {
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
