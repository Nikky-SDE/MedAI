import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Droplet, AlertCircle, FileText, ArrowLeft, CheckCircle2, Shield } from 'lucide-react'
import { saveProfile } from './actions'

import { Navbar } from '@/components/Navbar'
import { ProfileFormClient } from './ProfileFormClient'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, success?: string }>
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
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar userEmail={user.email} userName={profile?.full_name || null} />


      <div className="max-w-3xl mx-auto p-6 md:p-10 mb-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2">Health Profile</h1>
            <p className="text-lg text-[var(--text-secondary)]">Personalize your AI insights with your health data.</p>
          </div>
          <Link href="/dashboard" className="px-5 py-2.5 flex items-center bg-[var(--bg-card)] border border-[var(--border)] hover:border-[#C8856A] text-[var(--text-secondary)] hover:text-[#C8856A] font-medium rounded-xl shadow-sm transition-all hidden sm:flex gap-2">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl border border-[var(--border)] p-8 sm:p-10">

          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 font-medium rounded-r-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {decodeURIComponent(error)}
            </div>
          )}

          {success && (
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-500/10 border-l-4 border-green-500 text-green-700 dark:text-green-400 font-medium rounded-r-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              {decodeURIComponent(success)}
            </div>
          )}

          <ProfileFormClient initialProfile={profile} />
        </div>
      </div>
    </div>
  )
}
