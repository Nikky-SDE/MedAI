import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { DashboardClient } from './DashboardClient'

const PAGE_SIZE = 10

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; page?: string }>
}) {
  const { error, page: rawPage } = await searchParams
  const currentPage = Math.max(1, parseInt(rawPage || '1', 10))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Performance Optimization: Column Projection & Range-Based Pagination
  // Projections avoid transferring full OTC strings and huge diagnosis objects across all historical reports
  const { data: reports, count } = await supabase
    .from('reports')
    .select('id, created_at, is_emergency, symptom_description, ai_response', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalCount = count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded-md flex items-center gap-2 max-w-screen-xl mx-auto shadow-xs">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>{decodeURIComponent(error)}</span>
        </div>
      )}
      <DashboardClient
        reports={reports || []}
        userEmail={user.email || null}
        userName={profile?.full_name || null}
        currentPage={currentPage}
        totalPages={totalPages}
        totalReports={totalCount}
      />
    </div>
  )
}
