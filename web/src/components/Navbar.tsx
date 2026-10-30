'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { useLanguage, type Language } from './LanguageProvider'
import { Globe, ChevronDown, LogOut, User, Shield, PanelLeft } from 'lucide-react'

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
  isSidebarOpen?: boolean
}

export function Navbar({ userEmail, userName, onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const { language, setLanguage } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]
  const initials = userName
    ? userName.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() || 'U'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {(langOpen || userOpen) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setLangOpen(false)
            setUserOpen(false)
          }}
        />
      )}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Left: Sidebar Toggle + Logo (hidden when sidebar is open on desktop) */}
        <div className={`flex items-center gap-3 ${isSidebarOpen ? 'lg:hidden' : ''}`}>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="h-9 w-9 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-xs transition-colors"
              title="Open Sidebar"
              aria-label="Open Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-600 text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-white tracking-tight hidden md:block">MedAI</span>
          </Link>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2.5 ml-auto">

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(!langOpen); setUserOpen(false) }}
              aria-label="Language selector"
              className="flex items-center gap-1.5 h-9 px-3 rounded-md text-xs sm:text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-xs transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
              <span className="sm:hidden">{currentLang.flag}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-50 animate-scale-in origin-top-right">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code as Language); setLangOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm rounded-md transition-colors ${
                      language === lang.code
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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

          {/* User Avatar or Sign In Button */}
          {userEmail ? (
            <div className="relative">
              <button
                onClick={() => { setUserOpen(!userOpen); setLangOpen(false) }}
                aria-label="User account menu"
                className="h-9 w-9 rounded-md flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-xs transition-colors flex-shrink-0"
                title={userEmail}
              >
                {initials}
              </button>

              {userOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-50 animate-scale-in origin-top-right">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Signed in as</p>
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{userEmail}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      Health Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs leading-none"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
