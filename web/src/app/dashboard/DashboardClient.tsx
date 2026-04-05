'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { TriageForm } from './TriageForm'
import { useLanguage } from '@/components/LanguageProvider'
import { t } from '@/lib/i18n'
import {
  Plus, Clock, Activity, AlarmCheck, Shield,
  ChevronRight, FileText, ShieldAlert
} from 'lucide-react'

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

  const displayName = userName || userEmail?.split('@')[0] || 'there'

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ===== SIDEBAR ===== */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] h-full overflow-y-auto">

        {/* Brand */}
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">MedAI</span>
          </div>

          {/* New Assessment button */}
          <button
            onClick={() => setShowTriage(true)}
            className="w-full btn-gradient rounded-xl py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            {t('new_assessment', language)}
          </button>
        </div>

        {/* Report History */}
        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3 px-1">
            {t('past_reports', language)}
          </p>

          {reports.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-40" />
              <p className="text-xs text-[var(--text-muted)]">{t('no_reports', language)}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/report/${report.id}`}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border)] transition-all duration-150"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${report.is_emergency ? 'bg-red-500' : 'bg-green-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[#C8856A] transition-colors">
                      {report.ai_response?.condition || 'Assessment'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      {report.is_emergency && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 rounded-full">URGENT</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* User profile at bottom */}
        <div className="p-4 border-t border-[var(--border)]">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-card)] transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[#C8856A] transition-colors">{displayName}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{userEmail}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Navbar (mobile + desktop top bar) */}
        <Navbar
          userEmail={userEmail}
          userName={userName}
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
