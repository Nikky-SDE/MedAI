import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Home, Activity, ShieldAlert, Pill, FileText, Stethoscope, ArrowLeft } from 'lucide-react'
import { DownloadPdfButton } from './DownloadPdfButton'
import { NearbyClinicsMap } from './NearbyClinicsMap'
import { ShareReportButtons } from './ShareReportButtons'
import { Navbar } from '@/components/Navbar'

export default async function ReportPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()

  // Fetch report first to check public status
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: { user } } = await supabase.auth.getUser()

  // If report doesn't exist, show error
  if (error || !report) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
        <div className="bg-[var(--bg-card)] p-10 rounded-3xl shadow-2xl border border-[var(--border)] max-w-lg w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Report Not Found</h1>
          <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
            We couldn't locate the requested health report.
          </p>
          <Link href="/dashboard" className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-medium transition-all shadow-md">
            <Home className="w-5 h-5 mr-2" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Redirect if NOT public AND NOT logged in
  if (!report.is_public && !user) redirect('/login')

  const aiResponse = typeof report.ai_response === 'string'
    ? JSON.parse(report.ai_response)
    : report.ai_response

  const confColor = aiResponse?.confidenceLevel === 'High'
    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
    : aiResponse?.confidenceLevel === 'Medium'
    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar userEmail={user?.email || null} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 mb-20">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[#C8856A] transition-colors mb-3">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
              <Activity className="w-7 h-7 text-[#C8856A]" />
              Health AI Report
            </h1>
            <p className="text-[var(--text-muted)] mt-1 text-sm">
              {new Date(report.created_at).toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <ShareReportButtons 
              reportId={params.id} 
              isPublic={report.is_public} 
              isOwner={user?.id === report.user_id} 
            />
            <DownloadPdfButton />
          </div>
        </div>

        {/* Emergency Banner */}
        {report.is_emergency && (
          <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-3xl p-6 mb-8 shadow-lg flex items-center gap-4 animate-pulse">
            <AlertTriangle className="w-10 h-10 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-black mb-1">CRITICAL MEDICAL ALERT</h2>
              <p className="text-red-50 text-sm leading-relaxed">
                Your symptoms suggest a severe emergency. Please contact emergency services immediately or go to the nearest ER.
              </p>
            </div>
          </div>
        )}

        {/* Main Report Card */}
        <div id="report-content" className="bg-[var(--bg-card)] rounded-3xl shadow-xl border border-[var(--border)] overflow-hidden mb-8">

          {/* Report Header */}
          <div className="border-b border-[var(--border)] bg-[var(--bg-sidebar)] px-6 sm:px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-[#C8856A]" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Preliminary Assessment</h2>
            </div>
            {aiResponse?.confidenceLevel && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${confColor} hidden sm:block`}>
                {aiResponse.confidenceLevel} Confidence
              </span>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {/* Condition + Confidence Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <div className="rounded-2xl p-6 bg-gradient-to-br from-[#C8856A]/8 to-[#1B2A6B]/8 border border-[#C8856A]/15 dark:border-[#C8856A]/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                  <Activity className="w-20 h-20" />
                </div>
                <span className="text-xs font-bold text-[#C8856A] uppercase tracking-widest block mb-2">Probable Condition</span>
                <span className="text-2xl font-black text-[var(--text-primary)]">{aiResponse?.condition || 'Analyzing...'}</span>
              </div>

              <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-500/8 to-purple-500/8 border border-indigo-200/50 dark:border-indigo-500/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                  <Activity className="w-20 h-20" />
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2">AI Confidence</span>
                <span className="text-2xl font-black text-[var(--text-primary)]">{aiResponse?.confidenceLevel || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Explanation */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Condition Explanation</h3>
                </div>
                <div className="bg-[var(--bg-sidebar)] p-5 rounded-2xl border border-[var(--border)]">
                  <p className="text-[var(--text-secondary)] leading-relaxed">{aiResponse?.explanation || 'No explanation provided.'}</p>
                </div>
              </section>

              {/* OTC */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="w-4 h-4 text-[var(--text-muted)]" />
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Potential OTC Support</h3>
                </div>
                <div className="bg-[var(--bg-sidebar)] p-5 rounded-2xl border border-[var(--border)]">
                  <p className="text-[var(--text-secondary)] leading-relaxed">{aiResponse?.otcMedicineAdvice || 'No OTC recommendations.'}</p>
                </div>
              </section>

              {/* Recommendation */}
              <section>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border)]">
                  Recommended Next Steps
                </h3>
                <div className="bg-gradient-to-br from-[#C8856A]/8 to-[#1B2A6B]/8 p-5 rounded-2xl border border-[#C8856A]/15">
                  <p className="text-[var(--text-primary)] font-semibold leading-relaxed">{aiResponse?.recommendation || 'Consult a doctor.'}</p>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mb-8">
          <NearbyClinicsMap />
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-500/8 rounded-3xl p-6 border border-amber-200 dark:border-amber-500/20">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 dark:bg-amber-500/20 p-3 rounded-full flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-amber-900 dark:text-amber-300 font-bold text-base mb-2">Important Medical Disclaimer</h3>
              <p className="text-amber-800 dark:text-amber-400/80 text-sm leading-relaxed">
                This report was generated by AI analyzing your self-reported symptoms.{' '}
                <strong>MedAI is NOT a certified doctor</strong> and cannot diagnose conditions.
                This is purely educational and preliminary. Always consult a licensed medical professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
