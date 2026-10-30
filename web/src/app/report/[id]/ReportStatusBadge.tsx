'use client'

import { useState } from 'react'
import { Globe, Lock, Loader2 } from 'lucide-react'
import { toggleReportPublic } from './actions'

interface ReportStatusBadgeProps {
  reportId: string
  isPublic: boolean
  isOwner: boolean
}

export function ReportStatusBadge({ reportId, isPublic, isOwner }: ReportStatusBadgeProps) {
  const [publicState, setPublicState] = useState(isPublic)
  const [isChanging, setIsChanging] = useState(false)

  const handleToggle = async () => {
    if (!isOwner || isChanging) return
    setIsChanging(true)
    const nextState = !publicState
    try {
      await toggleReportPublic(reportId, publicState)
      setPublicState(nextState)
    } catch {
      // Revert if error
    } finally {
      setIsChanging(false)
    }
  }

  if (isOwner) {
    return (
      <button
        type="button"
        onClick={handleToggle}
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
