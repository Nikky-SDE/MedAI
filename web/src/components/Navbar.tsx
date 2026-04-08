'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { useLanguage } from './LanguageProvider'
import { Globe, ChevronDown, LogOut, User, Shield, Menu, History } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
]

interface NavbarProps {
  userEmail?: string | null
  userName?: string | null
  onToggleSidebar?: () => void
}

export function Navbar({ userEmail, userName, onToggleSidebar }: NavbarProps) {
  const { language, setLanguage } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() || 'U'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gradient-to-r dark:from-[#0a0a18] dark:via-[#12122a] dark:to-[#0a0a18] backdrop-blur-md border-b border-slate-200 dark:border-[#C8856A]/20">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Left: Sidebar Toggle + Logo */}
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2.5 rounded-xl text-slate-900 dark:text-white bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 transition-all duration-200 border border-slate-300 dark:border-white/20 shadow-sm active:scale-95"
              title="Toggle Assessment History"
            >
              <History className="w-5 h-5 text-[#C8856A]" strokeWidth={2.5} />
            </button>
          )}
          
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] shadow-md group-hover:shadow-lg transition-all group-hover:-translate-y-0.5">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black gradient-text hidden md:block tracking-tight">MedAI</span>
          </Link>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(!langOpen); setUserOpen(false) }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black bg-slate-100 dark:bg-[#1B2A6B] text-[#1B2A6B] dark:text-white transition-all duration-200 border-2 border-slate-300 dark:border-white/20 shadow-md hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Globe className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
              <span className="sm:hidden">{currentLang.flag}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden animate-slide-up z-50">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code as any); setLangOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                      language === lang.code
                        ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Avatar */}
          {userEmail && (
            <div className="relative">
              <button
                onClick={() => { setUserOpen(!userOpen); setLangOpen(false) }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-[#C8856A] to-[#1B2A6B] shadow-md hover:shadow-lg transition-shadow flex-shrink-0"
                title={userEmail}
              >
                {initials}
              </button>

              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden animate-slide-up z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-white/8">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{userEmail}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Health Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
