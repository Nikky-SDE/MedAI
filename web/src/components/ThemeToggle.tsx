'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 bg-transparent" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/10 border-2 border-slate-300 dark:border-[#C8856A]/40 hover:border-[#C8856A] transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
      ) : (
        <Moon className="w-5 h-5 text-[#1B2A6B]" strokeWidth={2.5} />
      )}
    </button>
  )
}
