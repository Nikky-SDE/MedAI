import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, ShieldAlert } from 'lucide-react'
import { analyzeSymptoms } from './actions'
import { SubmitButton } from './SubmitButton'
import { ImageUpload } from './ImageUpload'
import { ReportHistory } from './ReportHistory'
import { SymptomInput } from './SymptomInput'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Historical Reports
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 mb-20 font-sans">
      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-medium rounded-r-lg flex items-center shadow-sm">
          <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{decodeURIComponent(error)}</span>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Health Assessment
          </h1>
          <p className="text-xl text-slate-600">
            Describe your symptoms or upload a photo, and our AI will provide preliminary insights.
          </p>
        </div>
        <Link href="/profile" className="px-5 py-2.5 flex items-center bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-indigo-100 flex-shrink-0">
          <User className="w-5 h-5 mr-2" />
          Health Profile
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 sm:p-10">
        <form action={analyzeSymptoms} className="space-y-8 flex flex-col">
          <div className="space-y-3">
            <label htmlFor="symptoms" className="block text-lg font-semibold text-slate-800">
              How are you feeling today?
            </label>
            <SymptomInput />
          </div>

          <div className="space-y-3">
            <label htmlFor="medications" className="block text-lg font-semibold text-slate-800">
              Current Medications <span className="text-slate-400 font-normal text-sm block sm:inline sm:ml-2">(Optional)</span>
            </label>
            <input
              id="medications"
              name="medications"
              type="text"
              className="w-full rounded-xl border border-slate-300 p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
              placeholder="E.g., Ibuprofen, Vitamin D3..."
            />
          </div>

          <div className="space-y-3">
            <label className="block text-lg font-semibold text-slate-800">
              Upload a Photo <span className="text-slate-400 font-normal text-sm block sm:inline sm:ml-2">(e.g., skin rash, minor injury)</span>
            </label>
            <ImageUpload />
          </div>

          <div className="pt-6 border-t border-slate-100">
            <SubmitButton />
          </div>
        </form>
      </div>

      {/* Interactive History Toggle Component */}
      <ReportHistory reports={reports || []} />
    </div>
  )
}
