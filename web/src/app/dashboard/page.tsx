import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { analyzeSymptoms } from './actions'
import { SubmitButton } from './SubmitButton'
import { ImageUpload } from './ImageUpload'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 mb-20 font-sans">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
          Health Assessment
        </h1>
        <p className="text-xl text-slate-600">
          Describe your symptoms or upload a photo, and our AI will provide preliminary insights to guide your next steps.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 sm:p-10">
        <form action={analyzeSymptoms} className="space-y-8 flex flex-col">
          <div className="space-y-3">
            <label htmlFor="symptoms" className="block text-lg font-semibold text-slate-800">
              How are you feeling today?
            </label>
            <textarea
              id="symptoms"
              name="symptoms"
              rows={5}
              required
              className="w-full rounded-xl border border-slate-300 p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-none shadow-sm"
              placeholder="E.g., I have had a persistent headache for the last 2 days accompanied by mild nausea..."
            ></textarea>
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
    </div>
  )
}
