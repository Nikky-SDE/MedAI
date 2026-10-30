'use client'

import dynamic from 'next/dynamic'

export const MapLoader = dynamic(
  () => import('./NearbyClinicsMap').then(mod => mod.NearbyClinicsMap),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-64 w-full bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
        Loading clinical map...
      </div>
    ) 
  }
)
