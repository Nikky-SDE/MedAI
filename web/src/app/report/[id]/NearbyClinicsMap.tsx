'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer, MapRef } from 'react-map-gl/maplibre'
import { setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, Map as MapIcon, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useGeolocation, GeoCoordinates } from './hooks/useGeolocation'
import { useNearbyClinics, HospitalNode } from './hooks/useNearbyClinics'
import { ClinicCard } from './components/ClinicCard'
import { MapSearchBar } from './components/MapSearchBar'

if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre-gl-worker.mjs')
}

// High-resolution OpenStreetMap raster street style
// 100% open-source, zero API keys required, zero watermarks, global street coverage
const OPENSTREETMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim() || ''

// Default to OPENSTREETMAP_STYLE for robust zero-config rendering without API keys or watermarks;
// If a working non-placeholder MapTiler key is supplied, use streets-v2 vector style
const INITIAL_MAP_STYLE: string | StyleSpecification =
  MAPTILER_KEY && !MAPTILER_KEY.startsWith('Uh5Cn')
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
    : OPENSTREETMAP_STYLE

export function NearbyClinicsMap() {
  const mapRef = useRef<MapRef>(null)

  const { userLocation, loading: geoLoading, error: geoError, setUserLocation } = useGeolocation()
  const { hospitals, loading: clinicsLoading, isCached, fetchHospitals } = useNearbyClinics()

  const [selectedHospital, setSelectedHospital] = useState<HospitalNode | null>(null)
  const [activeRouteId, setActiveRouteId] = useState<number | null>(null)
  const [routeData, setRouteData] = useState<GeoJSON.Geometry | null>(null)
  const [isRouting, setIsRouting] = useState(false)
  const [currentMapStyle, setCurrentMapStyle] = useState<string | StyleSpecification>(INITIAL_MAP_STYLE)

  // Automatic graceful fallback to OpenStreetMap raster tiles
  const handleMapError = useCallback((e: { error?: { message?: string } }) => {
    console.warn('Map style encountered an issue, gracefully falling back to OpenStreetMap tiles:', e?.error?.message || e)
    setCurrentMapStyle(OPENSTREETMAP_STYLE)
  }, [])

  // When userLocation is resolved, fetch clinics
  useEffect(() => {
    if (userLocation) {
      fetchHospitals(userLocation.lat, userLocation.lon)
    }
  }, [userLocation, fetchHospitals])

  // Driving Route calculation via OSRM
  const handleSelectRoute = useCallback(
    async (hospital: HospitalNode) => {
      if (!userLocation) return

      setActiveRouteId(hospital.id)
      setSelectedHospital(hospital)
      setIsRouting(true)

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lon},${userLocation.lat};${hospital.lon},${hospital.lat}?overview=full&geometries=geojson`
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) })

        if (res.ok) {
          const json = await res.json()
          if (json.routes?.[0]?.geometry) {
            const rawGeometry = json.routes[0].geometry
            setRouteData(rawGeometry)

            const rawCoords = rawGeometry.coordinates
            const validCoords: [number, number][] = Array.isArray(rawCoords)
              ? rawCoords.filter(
                  (c: unknown): c is [number, number] =>
                    Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1])
                )
              : []

            const points: [number, number][] =
              validCoords.length > 0
                ? validCoords
                : [
                    [userLocation.lon, userLocation.lat],
                    [hospital.lon, hospital.lat],
                  ]

            let minLng = Infinity,
              minLat = Infinity,
              maxLng = -Infinity,
              maxLat = -Infinity
            for (const [lng, lat] of points) {
              if (lng < minLng) minLng = lng
              if (lat < minLat) minLat = lat
              if (lng > maxLng) maxLng = lng
              if (lat > maxLat) maxLat = lat
            }

            if (mapRef.current) {
              mapRef.current.getMap().fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                { padding: 60, maxZoom: 16, duration: 1000 }
              )
            }
          }
        }
      } catch (err) {
        console.warn('OSRM routing request failed:', err)
        setRouteData(null)
      } finally {
        setIsRouting(false)
      }
    },
    [userLocation]
  )

  const handleManualLocationFound = (coords: GeoCoordinates) => {
    setUserLocation(coords)
    setRouteData(null)
    setActiveRouteId(null)
    setSelectedHospital(null)
    if (mapRef.current) {
      mapRef.current.getMap().flyTo({
        center: [coords.lon, coords.lat],
        zoom: 13,
        duration: 1000,
      })
    }
  }

  const isLoading = geoLoading || clinicsLoading

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
      {/* Map Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Nearby Verified Health Facilities</h2>
          {isCached && (
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
              Cached
            </span>
          )}
        </div>

        <div className="w-full sm:w-72">
          <MapSearchBar onLocationFound={handleManualLocationFound} disabled={isLoading} />
        </div>
      </div>

      {/* Map Canvas Area */}
      <div className="relative w-full h-[360px] sm:h-[400px] bg-slate-100 dark:bg-slate-950">
        {userLocation ? (
          <Map
            ref={mapRef}
            initialViewState={{
              latitude: userLocation.lat,
              longitude: userLocation.lon,
              zoom: 13,
            }}
            mapStyle={currentMapStyle}
            onError={handleMapError}
            attributionControl={false}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="bottom-right" showCompass={false} />
            <FullscreenControl position="bottom-right" />

            {/* OSRM Route Layer */}
            {routeData && (
              <Source id="route-source" type="geojson" data={{ type: 'Feature', geometry: routeData, properties: {} }}>
                <Layer
                  id="route-layer"
                  type="line"
                  paint={{
                    'line-color': '#2563EB',
                    'line-width': 4,
                    'line-opacity': 0.9,
                  }}
                />
              </Source>
            )}

            {/* User Location Pulse Marker */}
            {userLocation && (
              <Marker longitude={userLocation.lon} latitude={userLocation.lat} anchor="center">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-60" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </Marker>
            )}

            {/* Clinic / Hospital Markers */}
            {hospitals.map((hospital) => {
              const isActive = activeRouteId === hospital.id
              const isEmergency = hospital.tags?.emergency === 'yes'
              return (
                <Marker
                  key={hospital.id}
                  longitude={hospital.lon}
                  latitude={hospital.lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    setSelectedHospital(hospital)
                    handleSelectRoute(hospital)
                  }}
                >
                  <div
                    className={`cursor-pointer transition-transform duration-150 ${
                      isActive ? 'scale-110 z-30' : 'z-10 hover:scale-105'
                    }`}
                    title={hospital.tags?.name || 'Medical Center'}
                  >
                    <div
                      className={`p-1 rounded-md shadow-xs border border-white ${
                        isActive
                          ? 'bg-slate-900 text-white ring-2 ring-blue-600'
                          : isEmergency
                          ? 'bg-red-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" fill="currentColor" />
                    </div>
                  </div>
                </Marker>
              )
            })}

            {/* Selected Hospital Popup */}
            {selectedHospital && (
              <Popup
                longitude={selectedHospital.lon}
                latitude={selectedHospital.lat}
                anchor="top"
                onClose={() => setSelectedHospital(null)}
                closeOnClick={false}
                className="rounded-md overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 z-50"
              >
                <div className="p-2 text-slate-900 dark:text-slate-100 min-w-[180px]">
                  <h3 className="font-semibold text-xs mb-0.5 text-slate-900 leading-tight">
                    {selectedHospital.tags?.name || 'Medical Center'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    {selectedHospital.distance !== undefined
                      ? `${selectedHospital.distance.toFixed(1)} km away`
                      : 'Nearby'}
                  </p>
                  <div className="flex flex-wrap gap-1 text-[10px] font-medium mt-1.5">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded capitalize">
                      {selectedHospital.tags?.amenity || 'Medical'}
                    </span>
                    {selectedHospital.tags?.emergency === 'yes' && (
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        Emergency
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Resolving regional clinical mapping...</p>
          </div>
        )}

        {/* Floating Refresh button */}
        {userLocation && (
          <button
            type="button"
            onClick={() => fetchHospitals(userLocation.lat, userLocation.lon, true)}
            disabled={isLoading}
            className="absolute top-3 right-3 h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-xs text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh nearby facilities"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${clinicsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>

      {/* Facilities List Panel */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Closest Facilities ({hospitals.length})
          </h3>
          {geoError && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Regional fallback</span>
            </span>
          )}
        </div>

        {clinicsLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-xs text-slate-500">Searching open healthcare registries...</p>
          </div>
        ) : hospitals.length > 0 ? (
          <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
            {hospitals.map((hospital) => (
              <ClinicCard
                key={`clinic-${hospital.id}`}
                hospital={hospital}
                isActive={activeRouteId === hospital.id}
                isRouting={isRouting}
                onSelectRoute={handleSelectRoute}
              />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No clinics or medical facilities identified in this radius. Use the search bar above to look up another city.
          </div>
        )}
      </div>
    </div>
  )
}
