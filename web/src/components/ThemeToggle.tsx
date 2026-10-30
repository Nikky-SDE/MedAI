'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent" />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 rounded-md flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-500" strokeWidth={2} />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={2} />
      )}
    </button>
  )
}
