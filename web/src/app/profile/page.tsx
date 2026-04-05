import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Droplet, AlertCircle, FileText, ArrowLeft, CheckCircle2, Shield } from 'lucide-react'
import { saveProfile } from './actions'
import { Navbar } from '@/components/Navbar'

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
      <Navbar userEmail={user.email} userName={profile?.full_name || null} language="en" onLanguageChange={() => {}} />

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

          <form action={saveProfile} className="space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="age" className="font-semibold text-[var(--text-primary)] flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-[var(--text-muted)]" /> Age
                </label>
                <input
                  id="age" name="age" type="number"
                  defaultValue={profile?.age || ''}
                  min="0" max="120"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm input-focus"
                  placeholder="e.g. 28"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="bloodGroup" className="font-semibold text-[var(--text-primary)] flex items-center gap-2 text-sm">
                  <Droplet className="w-4 h-4 text-red-400" /> Blood Group
                </label>
                <select
                  id="bloodGroup" name="bloodGroup"
                  defaultValue={profile?.blood_group || ''}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-[var(--text-primary)] text-sm input-focus"
                >
                  <option value="" disabled>Select blood group</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'].map(bg => (
                    <option key={bg} value={bg}>{bg === 'Unknown' ? "I don't know" : bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="allergies" className="font-semibold text-[var(--text-primary)] flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Known Allergies
              </label>
              <input
                id="allergies" name="allergies" type="text"
                defaultValue={profile?.allergies || ''}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm input-focus"
                placeholder="e.g. Peanuts, Penicillin, Dust mites..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="medicalHistory" className="font-semibold text-[var(--text-primary)] flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-blue-400" /> Chronic Medical History
              </label>
              <textarea
                id="medicalHistory" name="medicalHistory" rows={4}
                defaultValue={profile?.medical_history || ''}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm input-focus resize-none"
                placeholder="e.g. Asthma, Type 2 Diabetes, Hypertension..."
              />
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <button type="submit" className="w-full btn-gradient py-4 rounded-xl font-bold text-lg shadow-lg">
                Save Health Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
