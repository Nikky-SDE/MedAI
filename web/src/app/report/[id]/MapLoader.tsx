'use client'

import dynamic from 'next/dynamic'

export const MapLoader = dynamic(
  () => import('./NearbyClinicsMap').then(mod => mod.NearbyClinicsMap),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-64 w-full bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse flex items-center justify-center text-[var(--text-muted)]">
        Loading clinical map...
      </div>
    ) 
  }
)
