'use client'

import { useState } from 'react'
import { Copy, Share2, Mail, Check, Lock, Globe, Loader2 } from 'lucide-react'
import { toggleReportPublic } from './actions'

interface ShareReportButtonsProps {
  reportId: string
  isPublic: boolean
  isOwner: boolean
}

export function ShareReportButtons({ reportId, isPublic, isOwner }: ShareReportButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const getUrl = () => typeof window !== 'undefined' ? `${window.location.origin}/report/${reportId}` : ''

  const copyLink = async () => {
    await navigator.clipboard.writeText(getUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`Check my MedAI health report: ${getUrl()}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const shareEmail = () => {
    const url = getUrl()
    const subject = encodeURIComponent('My MedAI Health Report')
    const body = encodeURIComponent(`Hi,\n\nI wanted to share my AI-generated health assessment with you.\n\n${url}\n\nNote: This report is for informational purposes only and is not a medical diagnosis.`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleToggle = async () => {
    if (!isOwner || isChanging) return
    setIsChanging(true)
    try {
      await toggleReportPublic(reportId, isPublic)
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Public/Private Toggle (Owner only) */}
      {isOwner ? (
        <button
          onClick={handleToggle}
          disabled={isChanging}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
            isPublic
              ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
              : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100'
          }`}
          title={isPublic ? 'Make Private' : 'Make Public'}
        >
          {isChanging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPublic ? (
            <Globe className="w-4 h-4" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isPublic ? 'Public Assessment' : 'Private Assessment'}
          </span>
        </button>
      ) : (
        isPublic && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400">
            <Globe className="w-3.5 h-3.5" />
            <span>Shared Publicly</span>
          </div>
        )
      )}

      {/* Copy Link */}
      <button
        onClick={copyLink}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
          copied
            ? 'bg-green-50 dark:bg-green-500/10 border-green-300 dark:border-green-500/30 text-green-600 dark:text-green-400'
            : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#C8856A] hover:text-[#C8856A]'
        }`}
        title="Copy shareable link"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
      </button>

      {/* WhatsApp - Show for owner always, or for anyone if public */}
      {(isOwner || isPublic) && (
        <button
          onClick={shareWhatsApp}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 hover:shadow-md transition-all duration-200"
          title="Share via WhatsApp"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>
      )}

      {/* Email - Show for owner always, or for anyone if public */}
      {(isOwner || isPublic) && (
        <button
          onClick={shareEmail}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-indigo-300 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:shadow-md transition-all duration-200"
          title="Share via Email"
        >
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">Email</span>
        </button>
      )}
    </div>
  )
}
