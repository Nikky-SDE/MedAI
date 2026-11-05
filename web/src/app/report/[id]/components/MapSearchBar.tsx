'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

interface MapSearchBarProps {
  onLocationFound: (coords: { lat: number; lon: number }, displayName: string) => void
  disabled?: boolean
}

export function MapSearchBar({ onLocationFound, disabled }: MapSearchBarProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanQuery = query.trim()
    if (!cleanQuery) return

    setLoading(true)
    setError(null)

    try {
      // Calls server-side geocoding route with memory caching
      const res = await fetch(`/api/clinics/geocode?q=${encodeURIComponent(cleanQuery)}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Location not found. Try another city or postal code.')
          return
        }
        throw new Error('Geocoding search failed')
      }

      const data = await res.json()
      onLocationFound({ lat: data.lat, lon: data.lon }, data.displayName)
      setQuery('')
    } catch {
      setError('Unable to resolve location. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city, postal code, or area..."
          aria-label="Search city, postal code, or area"
          disabled={disabled || loading}
          className="w-full h-8 pl-8 pr-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
        <button
          type="submit"
          disabled={disabled || loading || !query.trim()}
          className="absolute right-1 h-6 px-2 text-[11px] font-medium rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
        </button>
      </form>
      {error && <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 pl-1">{error}</p>}
    </div>
  )
}
