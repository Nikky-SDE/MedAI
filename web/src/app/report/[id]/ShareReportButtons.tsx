'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Share2, Mail, Check, ChevronDown } from 'lucide-react'

interface ShareReportButtonsProps {
  reportId: string
  isPublic: boolean
  isOwner: boolean
}

export function ShareReportButtons({ reportId, isPublic }: ShareReportButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const getUrl = () => typeof window !== 'undefined' ? `${window.location.origin}/report/${reportId}` : ''

  const copyLink = async () => {
    await navigator.clipboard.writeText(getUrl())
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setIsOpen(false)
    }, 1500)
  }

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`Check my MedAI health report: ${getUrl()}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
    setIsOpen(false)
  }

  const shareEmail = () => {
    const url = getUrl()
    const subject = encodeURIComponent('My MedAI Health Report')
    const body = encodeURIComponent(`Hi,\n\nI wanted to share my AI-generated health assessment with you.\n\n${url}\n\nNote: This report is for informational purposes only and is not a medical diagnosis.`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
    setIsOpen(false)
  }

  // Dismiss on outside click and Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Share assessment"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 h-10 px-3.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span>Share</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-50 animate-scale-in origin-top-right focus:outline-none"
        >
          {/* Copy Link Option */}
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </div>
            {copied && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                Copied
              </span>
            )}
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

          {/* WhatsApp Option */}
          <button
            type="button"
            role="menuitem"
            onClick={shareWhatsApp}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          {/* Email Option */}
          <button
            type="button"
            role="menuitem"
            onClick={shareEmail}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Email</span>
          </button>

          {!isPublic && (
            <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 px-3 py-1 text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
              Report is private. Others can only view if toggled to Public.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
