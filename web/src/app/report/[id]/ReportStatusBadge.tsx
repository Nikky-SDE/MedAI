'use client'

import { useState } from 'react'
import { Globe, Lock, Loader2, AlertTriangle, X } from 'lucide-react'
import { toggleReportPublic } from './actions'

interface ReportStatusBadgeProps {
  reportId: string
  isPublic: boolean
  isOwner: boolean
}

export function ReportStatusBadge({ reportId, isPublic, isOwner }: ReportStatusBadgeProps) {
  const [publicState, setPublicState] = useState(isPublic)
  const [isChanging, setIsChanging] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const executeToggle = async () => {
    if (!isOwner || isChanging) return
    setIsChanging(true)
    const nextState = !publicState
    try {
      await toggleReportPublic(reportId, publicState)
      setPublicState(nextState)
      setShowWarningModal(false)
    } catch (err) {
      console.error('Failed to toggle report visibility:', err)
    } finally {
      setIsChanging(false)
    }
  }

  const handleButtonClick = () => {
    if (!isOwner || isChanging) return
    if (!publicState) {
      // Opening up access: Warn user before making report public
      setShowWarningModal(true)
    } else {
      // Reverting to private: safe to do immediately
      executeToggle()
    }
  }

  if (isOwner) {
    return (
      <>
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isChanging}
          aria-label={publicState ? 'Make assessment private' : 'Make assessment public'}
          title="Click to toggle public/private access"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium border transition-all duration-150 active:scale-95 disabled:opacity-60 cursor-pointer ${
            publicState
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 ring-1 ring-inset ring-emerald-600/10'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 ring-1 ring-inset ring-amber-600/10'
          }`}
        >
          {isChanging ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : publicState ? (
            <Globe className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          <span>{publicState ? 'Public Assessment' : 'Private Assessment'}</span>
        </button>

        {/* Warning Modal before making assessment public */}
        {showWarningModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="warning-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
          >
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 relative">
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                disabled={isChanging}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="warning-modal-title" className="text-base font-semibold text-slate-900 dark:text-white">
                    Make Health Assessment Public?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Please review how sharing works before publishing your assessment.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-md p-3.5 mb-5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-2">
                <p>
                  <strong>What will be visible:</strong> Anyone with this link will be able to view your reported symptoms, attached reference photo, and the AI diagnostic analysis.
                </p>
                <p>
                  <strong>What remains private:</strong> Your personal account credentials, email, and unrelated medical profile information are never exposed.
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  You can revoke public access and return this assessment to Private at any time.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  disabled={isChanging}
                  className="px-4 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeToggle}
                  disabled={isChanging}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-60"
                >
                  {isChanging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm & Make Public</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (publicState) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 ring-1 ring-inset ring-emerald-600/10">
        <Globe className="w-3.5 h-3.5" />
        <span>Public Assessment</span>
      </span>
    )
  }

  return null
}
