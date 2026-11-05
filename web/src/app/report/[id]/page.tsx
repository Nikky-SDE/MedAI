import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AlertTriangle, Home, Activity, ShieldAlert, Pill, FileText, Stethoscope, ArrowLeft, Plus, Calendar, Image as ImageIcon } from 'lucide-react'
import { DownloadPdfButton } from './DownloadPdfButton'
import { MapLoader } from './MapLoader'
import { ShareReportButtons } from './ShareReportButtons'
import { ReportStatusBadge } from './ReportStatusBadge'
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Report Not Found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            We couldn&apos;t locate the requested health report or it has been removed.
          </p>
          <Link href="/dashboard" className="inline-flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 h-9 px-4 rounded-md text-sm font-medium transition-colors shadow-xs">
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Enforce access control: if report is private, ONLY the owner can access it
  if (!report.is_public && (!user || user.id !== report.user_id)) {
    if (!user) {
      redirect('/login')
    } else {
      redirect('/dashboard?error=' + encodeURIComponent('You do not have permission to view this private health report.'))
    }
  }

  // Generate a signed URL for secure private bucket viewing (valid for 1 hour)
  let displayImageUrl: string | null = null
  if (report.image_url) {
    let storagePath = report.image_url
    if (storagePath.includes('/symptoms/')) {
      storagePath = storagePath.split('/symptoms/')[1]
    }
    const { data: signedData } = await supabase.storage
      .from('symptoms')
      .createSignedUrl(storagePath, 3600)
    displayImageUrl = signedData?.signedUrl || report.image_url
  }

  let aiResponse = report.ai_response
  if (typeof aiResponse === 'string') {
    try {
      aiResponse = JSON.parse(aiResponse)
    } catch {
      aiResponse = null
    }
  }

  const confColor = aiResponse?.confidenceLevel === 'High'
    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 ring-emerald-600/20'
    : aiResponse?.confidenceLevel === 'Medium'
    ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 ring-amber-600/20'
    : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 ring-red-600/20'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar userEmail={user?.email || null} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mb-16">

        {/* Header: Clean Two-Column Flex Layout */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          {/* Left Column: Navigation, Title & Date */}
          <div className="flex-1 min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Activity className="w-4 h-4" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
                Health AI Report
              </h1>
              <ReportStatusBadge 
                reportId={params.id} 
                isPublic={report.is_public} 
                isOwner={user?.id === report.user_id} 
              />
            </div>

            <p suppressHydrationWarning className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>
                {new Date(report.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </p>
          </div>

          {/* Right Column: Neat Right-Aligned Actions Group */}
          <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap flex-shrink-0 print:hidden pt-1 md:pt-0">
            {/* Grouped Share Dropdown */}
            <ShareReportButtons 
              reportId={params.id} 
              isPublic={report.is_public} 
              isOwner={user?.id === report.user_id} 
            />

            {/* Secondary Action: Outline New Assessment Button */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 h-10 px-4 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>New Assessment</span>
            </Link>

            {/* Primary Action: Solid Clinical Download PDF Button */}
            <DownloadPdfButton />
          </div>
        </div>

        {/* Emergency Banner */}
        {report.is_emergency && (
          <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-5 mb-6 shadow-xs flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-red-900 dark:text-red-200 mb-1">CRITICAL MEDICAL ALERT</h2>
              <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed font-normal">
                Your symptoms suggest a severe medical emergency. Please contact emergency services immediately or go to the nearest emergency room.
              </p>
            </div>
          </div>
        )}

        {/* Main Report Card */}
        <div id="report-content" className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">

          {/* Report Card Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Preliminary Assessment</h2>
            </div>
            {aiResponse?.confidenceLevel && (
              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${confColor}`}>
                {aiResponse.confidenceLevel} Certainty
              </span>
            )}
          </div>

          <div className="p-6">
            {/* Condition + Confidence Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-md p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Probable Condition</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{aiResponse?.condition || 'Analyzing...'}</span>
              </div>

              <div className="rounded-md p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Model-Reported Certainty</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{aiResponse?.certaintyLevel || aiResponse?.confidenceLevel || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Explanation */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Condition Explanation</h3>
                </div>
                <div className="bg-slate-50/60 dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                  <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal">{aiResponse?.explanation || 'No explanation provided.'}</p>
                </div>
              </section>

              {/* OTC Support */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Curated OTC Interaction Guidance (Limited Coverage)</h3>
                </div>
                <div className="bg-slate-50/60 dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                  <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-line">{aiResponse?.otcMedicineAdvice || 'No OTC recommendations.'}</p>
                </div>
              </section>

              {/* Attached Symptom Photo (if present) */}
              {displayImageUrl && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attached Symptom Photo</h3>
                  </div>
                  <div className="bg-slate-50/60 dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 inline-block">
                    <Image
                      src={displayImageUrl}
                      alt="Symptom photo attached to health report"
                      width={640}
                      height={480}
                      className="max-h-72 w-auto rounded-md object-contain border border-slate-200 dark:border-slate-700 shadow-xs"
                      loading="lazy"
                    />
                  </div>
                </section>
              )}

              {/* Recommendation */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Recommended Next Steps
                </h3>
                <div className="bg-blue-50/40 dark:bg-slate-800 p-4 sm:p-5 rounded-md border border-blue-200 dark:border-slate-700">
                  <ul className="space-y-3">
                    {(aiResponse?.recommendation || 'Consult a licensed medical doctor.')
                      .split('\n')
                      .map((line: string) => line.trim())
                      .filter((line: string) => line.length > 0)
                      .map((line: string) => line.replace(/^[-*•\d.]+\s*/, '').trim())
                      .filter((line: string) => line.length > 0)
                      .map((step: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5 text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0 mt-2.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mb-6">
          <MapLoader />
        </div>

        {/* Start New Assessment Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 mb-6 shadow-xs print:hidden">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ready for another check?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Have new or different symptoms? Start a fresh triage session with MedAI.</p>
          </div>
          <Link
            href="/dashboard"
            className="h-10 px-4 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs inline-flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Assessment</span>
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-5 border border-amber-200 dark:border-amber-900/40">
          <div className="flex items-start gap-3.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">Important Medical Disclaimer</h3>
              <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-normal">
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
