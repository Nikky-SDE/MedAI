'use client'

import { Navigation, MapPin } from 'lucide-react'
import { HospitalNode } from '../hooks/useNearbyClinics'

interface ClinicCardProps {
  hospital: HospitalNode
  isActive: boolean
  isRouting: boolean
  onSelectRoute: (hospital: HospitalNode) => void
}

export function ClinicCard({
  hospital,
  isActive,
  isRouting,
  onSelectRoute,
}: ClinicCardProps) {
  const isEmergency = hospital.tags?.emergency === 'yes'

  return (
    <div
      className={`flex items-center justify-between py-3 px-2.5 rounded-md transition-colors ${
        isActive
          ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
      }`}
    >
      <div className="min-w-0 pr-3">
        <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
          {hospital.tags?.name || 'Unlisted Medical Center'}
        </h4>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {hospital.distance !== undefined ? `${hospital.distance.toFixed(1)} km away` : 'Nearby'}
          </span>
          <span className="text-[10px] font-medium text-slate-400 capitalize">
            · {hospital.tags?.amenity || 'Healthcare Facility'}
          </span>
          {isEmergency && (
            <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900">
              Emergency Services
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => onSelectRoute(hospital)}
          disabled={isRouting}
          className={`h-8 px-2.5 text-xs font-medium rounded border shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            isActive
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          title="Plot driving route on map"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{isActive ? 'Routing' : 'Route'}</span>
        </button>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 w-8 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-xs"
          title="Open in Google Maps"
          aria-label="Open directions in external map"
        >
          <MapPin className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
