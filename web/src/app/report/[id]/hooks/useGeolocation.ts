'use client'

import { useState, useCallback, useEffect } from 'react'

export interface GeoCoordinates {
  lat: number
  lon: number
}

const DEFAULT_COORDS: GeoCoordinates = { lat: 26.8467, lon: 80.9462 }

export function useGeolocation() {
  const [userLocation, setUserLocation] = useState<GeoCoordinates | null>(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return DEFAULT_COORDS
    }
    return null
  })

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return false
    }
    return true
  })

  const [error, setError] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && !('geolocation' in navigator)) {
      return 'Geolocation not supported by your browser'
    }
    return null
  })

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setUserLocation(DEFAULT_COORDS)
      setError('Geolocation not supported by your browser')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        })
        setLoading(false)
      },
      (err) => {
        console.warn('Geolocation failed or permission denied, using default fallback:', err.message)
        setUserLocation(DEFAULT_COORDS)
        setError('Location access denied. Displaying default regional area.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        })
        setLoading(false)
      },
      (err) => {
        console.warn('Geolocation failed or permission denied, using default fallback:', err.message)
        setUserLocation(DEFAULT_COORDS)
        setError('Location access denied. Displaying default regional area.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }, [])

  return {
    userLocation,
    loading,
    error,
    requestLocation,
    setUserLocation,
  }
}
