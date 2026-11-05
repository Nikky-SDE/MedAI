/**
 * MedAI Geocoding Server Route
 * 
 * Proxies Nominatim OpenStreetMap location searches to eliminate CORS,
 * enforce proper User-Agent headers, and cache repeated search terms in memory.
 */

import { NextResponse } from 'next/server'

const geocodeCache = new Map<string, { lat: number; lon: number; displayName: string; timestamp: number }>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_ENTRIES = 500 // Prevent memory leaks from unbounded geocode searches

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Search query parameter (q) is required' }, { status: 400 })
  }

  const cacheKey = query.toLowerCase()
  const cached = geocodeCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { lat: cached.lat, lon: cached.lon, displayName: cached.displayName, cached: true },
      { headers: { 'Cache-Control': 'public, s-maxage=86400', 'X-Cache': 'HIT' } }
    )
  }

  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'MedAI-Clinical-Triage/1.0 (Health Clinic Finder)',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 502 })
    }

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No location matches found for query' }, { status: 404 })
    }

    const first = data[0]
    const lat = parseFloat(first.lat)
    const lon = parseFloat(first.lon)
    const displayName = first.display_name

    if (geocodeCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = geocodeCache.keys().next().value
      if (oldestKey) geocodeCache.delete(oldestKey)
    }
    geocodeCache.set(cacheKey, { lat, lon, displayName, timestamp: Date.now() })

    return NextResponse.json(
      { lat, lon, displayName, cached: false },
      { headers: { 'Cache-Control': 'public, s-maxage=86400', 'X-Cache': 'MISS' } }
    )
  } catch (err) {
    console.warn('[Geocode Server Route] Failed or timed out:', err)
    return NextResponse.json({ error: 'Geocoding request timed out' }, { status: 504 })
  }
}
