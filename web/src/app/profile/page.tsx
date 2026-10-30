import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ProfileFormClient } from './ProfileFormClient'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { error, success } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Navbar userEmail={user.email} userName={profile?.full_name || null} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mb-16">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Health Profile</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Personalize your clinical AI insights with persistent health data.</p>
          </div>
          <Link href="/dashboard" className="h-9 px-3.5 flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-md shadow-xs transition-colors hidden sm:flex gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{decodeURIComponent(error)}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-md flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{decodeURIComponent(success)}</span>
            </div>
          )}

          <ProfileFormClient initialProfile={profile} />
        </div>
      </div>
    </div>
  )
}
