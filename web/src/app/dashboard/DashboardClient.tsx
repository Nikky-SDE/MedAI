'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/Navbar'
import { useLanguage } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import { deleteReport } from './actions'
import {
  Plus, Clock, Activity, Shield, ShieldAlert,
  FileText, Trash2,
  ChevronDown, ChevronUp, Loader2,
  PanelLeftClose
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
  currentPage?: number
  totalPages?: number
  totalReports?: number
}

export function DashboardClient({
  reports,
  userEmail,
  userName,
  currentPage = 1,
  totalPages = 1,
  totalReports = reports.length,
}: DashboardClientProps) {
  const { language } = useLanguage()
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false) // Mobile drawer
  const [isDesktopPinned, setIsDesktopPinned] = useState(true) // Desktop sidebar: open by default
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localReports, setLocalReports] = useState(reports)

  // Keep local optimistic list synchronized when server reports prop updates
  useEffect(() => {
    queueMicrotask(() => setLocalReports(reports))
  }, [reports])

  // Persist desktop sidebar preference in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('medai-sidebar-pinned')
    if (saved !== null) {
      queueMicrotask(() => setIsDesktopPinned(saved === 'true'))
    }
  }, [])

  const toggleDesktopSidebar = () => {
    const next = !isDesktopPinned
    setIsDesktopPinned(next)
    localStorage.setItem('medai-sidebar-pinned', String(next))
  }

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileSidebarOpen(prev => !prev)
    } else {
      toggleDesktopSidebar()
    }
  }

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
    } catch {
      setLocalReports(previousReports) // Rollback on failure
      alert('Delete failed. Please check your database permissions.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">

      {/* ===== OVERLAY (Mobile only) ===== */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`fixed lg:relative z-[70] lg:z-10 flex flex-col h-full border-r border-[var(--border)] bg-[var(--bg-sidebar)] transition-all duration-300 ease-in-out ${
        // Mobile: slide in/out as a drawer
        // Desktop: collapse to 0 or expand to w-72 based on pinned state
        isMobileSidebarOpen
          ? 'translate-x-0 w-72 shadow-2xl lg:shadow-none'
          : '-translate-x-full lg:translate-x-0'
      } ${
        isDesktopPinned
          ? 'lg:w-72'
          : 'lg:w-0 lg:opacity-0 lg:border-none lg:overflow-hidden'
      }`}>

        {/* Brand */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between w-full flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">MedAI</span>
          </div>
          <button 
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setIsMobileSidebarOpen(false)
              } else {
                toggleDesktopSidebar()
              }
            }}
            aria-label="Collapse sidebar"
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Assessment button */}
        <div className="px-3 my-4 overflow-hidden flex-shrink-0">
          <button
            onClick={() => {
              const el = document.getElementById('symptom-input')
              el?.focus()
            }}
            className="w-full h-10 rounded-md px-3 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <Plus className="w-4 h-4" />
            {t('new_assessment', language)}
          </button>
        </div>

        {/* Report History */}
        <div className="flex-1 px-3 py-2 overflow-y-auto no-scrollbar overflow-x-hidden">
          <button
            onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
            className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2.5 px-1 hover:text-slate-900 dark:hover:text-slate-200 transition-colors min-w-max"
          >
            <span>{t('past_reports', language)}</span>
            {isHistoryCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {!isHistoryCollapsed && (
            <div className="space-y-1.5 min-w-[240px]">
              {localReports.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-dashed border-slate-200 dark:border-slate-800">
                  <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('no_reports', language)}</p>
                </div>
              ) : (
                localReports.map((report) => (
                  <div key={report.id} className="group relative">
                    <Link
                      href={`/report/${report.id}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors pr-8 block"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${report.is_emergency ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                          {report.ai_response?.condition || 'Health Assessment'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <p suppressHydrationWarning className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                            {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, report.id)}
                      disabled={deletingId === report.id}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Delete assessment"
                    >
                      {deletingId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-1.5 pt-3 px-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <Link
                      href={`/dashboard?page=${currentPage - 1}`}
                      className={`px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-medium ${
                        currentPage <= 1
                          ? 'opacity-30 pointer-events-none'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      Previous
                    </Link>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {currentPage} / {totalPages}
                    </span>
                    <Link
                      href={`/dashboard?page=${currentPage + 1}`}
                      className={`px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-medium ${
                        currentPage >= totalPages
                          ? 'opacity-30 pointer-events-none'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      Next
                    </Link>
                  </div>
                  <p className="text-[11px] text-center text-slate-400">
                    Total {totalReports} assessments recorded
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User profile at bottom */}
        <div className="p-3.5 pt-4 mt-auto border-t border-slate-200 dark:border-slate-800 bg-[var(--bg-sidebar)] overflow-hidden">
          <Link href="/profile" className="flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group min-w-max">
            <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 text-sm font-semibold flex-shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
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
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={isDesktopPinned}
        />

        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

            {/* AI Greeting */}
            <div className="text-center mb-6">
              <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs mx-auto mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight mb-1.5">
                Hello, {displayName}
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-300">
                Describe your symptoms below for an instant clinical assessment.
              </p>
            </div>

            {/* Triage Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <TriageForm language={language} />
            </div>

            {/* Medical Disclaimer */}
            <div className="mt-8 max-w-xl mx-auto px-4 py-2.5 rounded-lg bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>MedAI is informational only. Not a substitute for professional medical advice.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
