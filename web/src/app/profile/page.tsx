import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Droplet, AlertCircle, FileText, Home, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { saveProfile } from './actions'

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
    <div className="max-w-3xl mx-auto p-6 md:p-10 mb-20 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Health Profile
          </h1>
          <p className="text-lg text-slate-600">
            Personalize your AI medical insights by securely storing your health data.
          </p>
        </div>
        <Link href="/dashboard" className="px-5 py-2.5 flex items-center bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-medium rounded-xl shadow-sm transition-all hidden sm:flex">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 sm:p-10">
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-medium rounded-r-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            {decodeURIComponent(error)}
          </div>
        )}
        
        {success && (
          <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 font-medium rounded-r-lg flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
            {decodeURIComponent(success)}
          </div>
        )}

        <form action={saveProfile} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age */}
            <div className="space-y-2">
              <label htmlFor="age" className="font-semibold text-slate-800 flex items-center">
                <User className="w-4 h-4 mr-2 text-slate-400" /> Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                defaultValue={profile?.age || ''}
                min="0" max="120"
                className="w-full rounded-xl border border-slate-300 p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
                placeholder="e.g. 28"
              />
            </div>

            {/* Blood Group */}
            <div className="space-y-2">
              <label htmlFor="bloodGroup" className="font-semibold text-slate-800 flex items-center">
                <Droplet className="w-4 h-4 mr-2 text-red-400" /> Blood Group
              </label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                defaultValue={profile?.blood_group || ''}
                className="w-full rounded-xl border border-slate-300 p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm bg-white"
              >
                <option value="" disabled>Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">I don't know</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="allergies" className="font-semibold text-slate-800 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-amber-400" /> Known Allergies
            </label>
            <input
              id="allergies"
              name="allergies"
              type="text"
              defaultValue={profile?.allergies || ''}
              className="w-full rounded-xl border border-slate-300 p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none shadow-sm"
              placeholder="e.g. Peanuts, Penicillin, Dust mites..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="medicalHistory" className="font-semibold text-slate-800 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-400" /> Chronic Medical History
            </label>
            <textarea
              id="medicalHistory"
              name="medicalHistory"
              rows={4}
              defaultValue={profile?.medical_history || ''}
              className="w-full rounded-xl border border-slate-300 p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-none shadow-sm"
              placeholder="e.g. Asthma, Type 2 Diabetes, Hypertension..."
            ></textarea>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              className="w-full flex justify-center py-4 px-8 border border-transparent rounded-xl shadow-lg text-xl font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transform transition-transform active:scale-95"
            >
              Save Health Profile
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center sm:hidden">
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
