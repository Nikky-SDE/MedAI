import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Home, Activity, ShieldAlert, Pill, FileText, Stethoscope } from 'lucide-react'
import { DownloadPdfButton } from './DownloadPdfButton'
import { NearbyClinicsMap } from './NearbyClinicsMap'

export default async function ReportPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-red-100 max-w-lg w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Report Not Found</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">We couldn't locate the requested health report. It may have been deleted, or you might not have permission to view it.</p>
          <Link href="/dashboard" className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
            <Home className="w-5 h-5 mr-2" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Parse JSON if needed
  const aiResponse = typeof report.ai_response === 'string' ? JSON.parse(report.ai_response) : report.ai_response

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none"></div>

      <div className="max-w-5xl mx-auto p-6 md:p-12 mb-20 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center">
              <Activity className="w-8 h-8 text-blue-600 mr-3" />
              Health AI Report
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Generated on {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}</p>
          </div>
          <div className="flex gap-3 print:hidden">
            <Link href="/dashboard" className="px-5 py-2.5 flex items-center bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-medium rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-blue-100 hidden sm:flex">
              <Home className="w-4 h-4 mr-2 text-blue-600" />
              Dashboard
            </Link>
            <DownloadPdfButton />
          </div>
        </div>

        {/* Emergency Banner */}
        {report.is_emergency && (
          <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-3xl p-8 mb-10 shadow-lg shadow-red-200 border border-red-500 flex flex-col md:flex-row items-center md:items-start animate-pulse">
            <AlertTriangle className="w-12 h-12 mr-0 md:mr-6 mb-4 md:mb-0 flex-shrink-0" />
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black mb-2 tracking-wide">CRITICAL MEDICAL ALERT</h2>
              <p className="font-medium text-red-50 text-lg leading-relaxed">
                Your symptoms strongly suggest a severe medical emergency. Do not wait. Please contact local emergency services immediately or proceed to the nearest Emergency Room.
              </p>
            </div>
          </div>
        )}

        {/* Main Card (This will be downloaded) */}
        <div id="report-content" className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-10 pt-2 pb-2">
          
          <div className="border-b border-slate-100 bg-slate-50/80 p-6 md:p-8 flex items-center justify-between">
            <div className="flex items-center">
              <Stethoscope className="w-7 h-7 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-800">Preliminary Assessment</h2>
            </div>
            {aiResponse?.confidenceLevel === 'High' && (
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest hidden sm:block">High Confidence</span>
            )}
          </div>
          
          <div className="p-6 md:p-10">
            {/* Condition & Confidence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-24 h-24 text-blue-600" /></div>
                <span className="text-sm font-bold text-blue-600 uppercase tracking-widest block mb-2 relative z-10">Probable Condition</span>
                <span className="text-3xl font-black text-slate-900 relative z-10">{aiResponse?.condition || 'Analyzing...'}</span>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-8 rounded-2xl border border-purple-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-24 h-24 text-purple-600" /></div>
                <span className="text-sm font-bold text-purple-600 uppercase tracking-widest block mb-2 relative z-10">AI Confidence Level</span>
                <span className="text-3xl font-black text-slate-900 relative z-10">{aiResponse?.confidenceLevel || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-10">
              {/* Explanation */}
              <section>
                <div className="flex items-center mb-4">
                  <FileText className="w-5 h-5 text-slate-400 mr-2" />
                  <h3 className="text-xl font-bold text-slate-800">Condition Explanation</h3>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed text-lg">
                    {aiResponse?.explanation || 'No explanation provided.'}
                  </p>
                </div>
              </section>

              {/* OTC Support */}
              <section>
                <div className="flex items-center mb-4">
                  <Pill className="w-5 h-5 text-slate-400 mr-2" />
                  <h3 className="text-xl font-bold text-slate-800">Potential OTC Support</h3>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed text-lg">
                    {aiResponse?.otcMedicineAdvice || 'No OTC recommendations available.'}
                  </p>
                </div>
              </section>
              
              {/* Recommendation */}
              <section>
                <h3 className="text-xl font-bold text-indigo-900 mb-4 block border-b border-indigo-100 pb-2">Recommended Next Steps</h3>
                <div className="bg-indigo-50 p-6 md:p-8 rounded-2xl border border-indigo-100">
                  <p className="text-indigo-900 font-semibold text-lg leading-relaxed">
                    {aiResponse?.recommendation || 'Consult a doctor for a proper diagnosis.'}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Dynamic Map Component */}
        <NearbyClinicsMap />

        {/* Disclaimer */}
        <div className="bg-amber-50 rounded-3xl p-8 border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="flex items-start md:items-center flex-col md:flex-row relative z-10">
            <div className="bg-amber-100 p-4 rounded-full mr-6 mb-4 md:mb-0">
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-amber-900 font-bold text-lg mb-2">Important Medical Disclaimer</h3>
              <p className="text-amber-800 text-base leading-relaxed">
                This report was generated by an Artificial Intelligence system analyzing your self-reported symptoms. <strong>medAI is NOT a certified doctor</strong> and cannot diagnose or treat medical conditions. This information is purely educational and preliminary. Always verify these insights with a licensed medical professional.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
