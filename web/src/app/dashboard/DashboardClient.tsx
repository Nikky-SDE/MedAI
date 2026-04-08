'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/Navbar'
import { useLanguage } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import { deleteReport } from './actions'
import {
  Plus, Clock, Activity, Shield,
  FileText, ShieldAlert, Trash2,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react'

// Lazy load the triage form to improve compile times and page load
const TriageForm = dynamic(() => import('./TriageForm').then(mod => mod.TriageForm), {
  loading: () => <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Assessment...</div>
})

interface Report {
  id: string
  created_at: string
  ai_response: { condition?: string; confidenceLevel?: string }
  is_emergency: boolean
  symptom_description: string
}

interface DashboardClientProps {
  reports: Report[]
  userEmail: string | null
  userName: string | null
}

export function DashboardClient({ reports, userEmail, userName }: DashboardClientProps) {
  const { language, setLanguage } = useLanguage()
  const [showTriage, setShowTriage] = useState(true)
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // Start open on desktop
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localReports, setLocalReports] = useState(reports)

  const displayName = userName || userEmail?.split('@')[0] || 'there'

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm('Are you sure you want to delete this assessment?')) return

    // Optimistic UI update
    const previousReports = [...localReports]
    setLocalReports(localReports.filter(r => r.id !== id))
    setDeletingId(id)
    
    try {
      await deleteReport(id)
    } catch (err) {
      setLocalReports(previousReports) // Rollback on failure
      alert('Delete failed. Please check your database permissions.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">

      {/* ===== OVERLAY (Mobile only) ===== */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`fixed lg:relative z-[70] lg:z-10 flex flex-col h-full border-r border-[var(--border)] bg-[var(--bg-sidebar)] transition-all duration-300 ease-in-out ${
        isSidebarOpen 
          ? 'translate-x-0 w-72 shadow-2xl lg:shadow-none' 
          : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:border-none'
      }`}>

        {/* Brand */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-max">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">MedAI</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        </div>

        {/* New Assessment button */}
        <div className="p-4 overflow-hidden">
          <button
            onClick={() => setShowTriage(true)}
            className="w-full btn-gradient rounded-xl py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all min-w-max"
          >
            <Plus className="w-4 h-4" />
            {t('new_assessment', language)}
          </button>
        </div>

        {/* Report History */}
        <div className="flex-1 p-4 overflow-y-auto no-scrollbar overflow-x-hidden">
          <button
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            className="w-full flex items-center justify-between text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-[0.25em] mb-5 px-1 hover:text-[#C8856A] transition-colors min-w-max"
          >
            <span>{t('past_reports', language)}</span>
            {isHistoryCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {!isHistoryCollapsed && (
            <div className="space-y-2 min-w-[250px]">
              {localReports.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-200/40 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                  <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3 opacity-50" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('no_reports', language)}</p>
                </div>
              ) : (
                localReports.map((report) => (
                  <div key={report.id} className="group relative">
                    <Link
                      href={`/report/${report.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[var(--bg-card)] hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-[var(--border)] hover:border-[#C8856A] transition-all duration-300 pr-10 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 relative ${report.is_emergency ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'}`}>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-inherit" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[var(--text-primary)] truncate group-hover:text-[#C8856A] transition-colors leading-tight">
                          {report.ai_response?.condition || 'Health Assessment'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                            {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, report.id)}
                      disabled={deletingId === report.id}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Delete assessment"
                    >
                      {deletingId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User profile at bottom */}
        <div className="p-4 border-t border-[var(--border)] overflow-hidden">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-all group min-w-max">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-inner">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-[#C8856A] transition-colors">{displayName}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">{userEmail}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* Navbar */}
        <Navbar
          userEmail={userEmail}
          userName={userName}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

            {/* AI Greeting */}
            <div className="text-center mb-8">
              {/* AI Orb */}
              <div className="relative inline-flex items-center justify-center mb-5">
                <div className="ai-orb w-20 h-20 rounded-full opacity-90" />
                <div className="absolute inset-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center">
                  <Activity className="w-8 h-8 text-white drop-shadow-md" />
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] mb-2">
                Hello, <span className="gradient-text">{displayName}</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-lg">
                How are you feeling today?
              </p>
            </div>

            {/* Triage Form Card */}
            <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden">
              <TriageForm language={language} />
            </div>

            {/* Medical Disclaimer */}
            <p className="text-center text-xs text-[var(--text-muted)] mt-6 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              MedAI is informational only. Not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
