'use client'

import { useState, useEffect, useRef } from 'react'
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer, MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, Navigation, Map as MapIcon, Loader2 } from 'lucide-react'

// MapTiler key
const MAPTILER_KEY = 'UCDBztthmBAIepr5Bk9u'

interface HospitalNode {
  id: number;
  lat: number;
  lon: number;
  distance?: number;
  tags: {
    name?: string;
    amenity?: string;
    emergency?: string;
  };
}

// Haversine formula to calculate true distance between coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export function NearbyClinicsMap() {
  const mapRef = useRef<MapRef>(null);
  
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 13,
  })
  
  const [hospitals, setHospitals] = useState<HospitalNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Interactive Routing States
  const [selectedHospital, setSelectedHospital] = useState<HospitalNode | null>(null)
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [routeData, setRouteData] = useState<any>(null)
  const [routeError, setRouteError] = useState<number | null>(null)
  const [activeRouteId, setActiveRouteId] = useState<number | null>(null)

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setViewState({
          longitude,
          latitude,
          zoom: 13,
        })
        setUserLocation({ lat: latitude, lon: longitude })

        try {
          // Fetch hospitals within 5000m (5km) using Overpass API
          const query = `
            [out:json];
            (
              node["amenity"="hospital"](around:5000,${latitude},${longitude});
              node["amenity"="clinic"](around:5000,${latitude},${longitude});
            );
            out body;
          `;
          
          const response = await fetch(`https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`)
          
          let data;
          try {
            const textResponse = await response.text();
            
            // Defensive check: If the API returns XML/HTML (like a 429 rate limit page), stop immediately
            if (textResponse.trim().startsWith('<')) {
              setError("Mapping API rate limit reached. Please try again later.");
              setLoading(false);
              return;
            }
            
            data = JSON.parse(textResponse);
          } catch (parseError) {
            setError("Mapping API rate limit reached. Please try again later.");
            setLoading(false);
            return;
          }
          
          if (!data || !data.elements) {
            setError("Invalid format received from mapping API.");
            setLoading(false);
            return;
          }

          // Format, calculate distances, and officially sort the nodes closest to furthest
          const validHospitals = data.elements
            .filter((el: any) => el.tags && el.tags.name)
            .map((el: any) => ({
              ...el,
              distance: calculateDistance(latitude, longitude, el.lat, el.lon)
            }))
            .sort((a: any, b: any) => a.distance - b.distance);
            
          setHospitals(validHospitals)
        } catch (err) {
          console.error("Overpass API Error:", err)
          setError("Failed to fetch nearby medical facilities.")
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        console.warn("Geolocation Error:", err)
        setError("Location access denied. We cannot show nearby clinics.")
        setLoading(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  // Defensive OSRM Route Fetching
  const fetchRoute = async (hospital: HospitalNode) => {
    if (!userLocation) return;
    
    // Reset route errors immediately when initializing a new search
    setRouteError(null);
    setActiveRouteId(hospital.id);
    setSelectedHospital(hospital);

    try {
      // OSRM Public Server requires Lon/Lat order
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lon},${userLocation.lat};${hospital.lon},${hospital.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`OSRM responded with status ${res.status}`);
      }
      
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
         throw new Error("No route found or empty geometry.");
      }

      setRouteData(data.routes[0].geometry);
      
      // Compute mathematical bounds to smoothly frame the route
      if (mapRef.current) {
        const coords = data.routes[0].geometry.coordinates;
        
        // Find minimum and maximum boundaries of the path array
        const bounds = coords.reduce((acc: any, coord: number[]) => {
          return [
            [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])], // SW coordinates
            [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])]  // NE coordinates
          ];
        }, [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]]);

        mapRef.current.fitBounds(bounds, { padding: 60, duration: 1200 });
      }

    } catch (err) {
      console.error("OSRM Routing Error:", err);
      // Gracefully show UI error instead of crashing the map
      setRouteError(hospital.id);
      setRouteData(null);
    }
  }

  if (error) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center print:hidden mt-10">
        <MapIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">Map Unavailable</h3>
        <p className="text-slate-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mt-10 print:hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Navigation className="w-6 h-6 text-indigo-600 mr-2" />
            Nearby Medical Facilities
          </h2>
          <p className="text-slate-500 mt-1">
            Hospitals and clinics perfectly mapped from your current location!
          </p>
        </div>
        {loading && (
          <div className="mt-4 sm:mt-0 flex items-center text-indigo-600 font-medium">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Locating...
          </div>
        )}
      </div>

      <div className="relative h-[400px] w-full bg-slate-100 flex items-center justify-center">
        {loading && !userLocation ? (
          <div className="animate-pulse flex flex-col items-center">
            <MapIcon className="w-10 h-10 text-slate-300 mb-3" />
            <div className="h-4 bg-slate-300 rounded w-48"></div>
          </div>
        ) : (
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle={`https://api.maptiler.com/maps/dataviz/style.json?key=${MAPTILER_KEY}`}
            style={{width: '100%', height: '100%'}}
          >
            <FullscreenControl position="top-right" />
            <NavigationControl position="top-right" />

            {/* OSRM Route Line Render */}
            {routeData && (
              <Source type="geojson" data={{ type: 'Feature', properties: {}, geometry: routeData }}>
                <Layer
                  id="route-line"
                  type="line"
                  paint={{
                    'line-color': '#4f46e5', // Beautiful indigo-600 match
                    'line-width': 5,
                    'line-opacity': 0.8
                  }}
                />
              </Source>
            )}

            {/* User Location Pulse Marker */}
            {userLocation && (
              <Marker longitude={userLocation.lon} latitude={userLocation.lat} anchor="center">
                <div className="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-[0_0_15px_rgba(79,70,229,0.8)] relative">
                  <div className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-75"></div>
                </div>
              </Marker>
            )}

            {/* Sorted Hospital Nodes */}
            {hospitals.map((hospital) => (
              <Marker
                key={hospital.id}
                longitude={hospital.lon}
                latitude={hospital.lat}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelectedHospital(hospital);
                  fetchRoute(hospital);
                }}
              >
                <div className={`cursor-pointer transform hover:scale-110 transition-transform ${
                  activeRouteId === hospital.id ? 'scale-125 z-10' : ''
                }`}>
                  <MapPin 
                    className={`w-8 h-8 ${activeRouteId === hospital.id ? 'text-indigo-600' : 'text-rose-500'} fill-white`} 
                    strokeWidth={1.5} 
                  />
                </div>
              </Marker>
            ))}

            {/* Hover/Click Detail Context */}
            {selectedHospital && (
              <Popup
                longitude={selectedHospital.lon}
                latitude={selectedHospital.lat}
                anchor="top"
                onClose={() => setSelectedHospital(null)}
                closeOnClick={false}
                className="rounded-xl overflow-hidden shadow-lg z-50"
              >
                <div className="p-2 -m-2">
                  <h3 className="font-bold text-slate-800 text-sm mb-1">{selectedHospital.tags.name}</h3>
                  <div className="flex gap-2 text-xs font-medium mt-2">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md capitalize">
                      {selectedHospital.tags.amenity || 'Medical'}
                    </span>
                    {selectedHospital.tags.emergency === 'yes' && (
                      <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                        Emergency Room
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        )}
      </div>

      {/* Hospital Advanced List UI */}
      {!loading && hospitals.length > 0 && (
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Closest Facilities</h3>
          <div className="max-h-[340px] overflow-y-auto pr-3 space-y-3 custom-scrollbar">
            {hospitals.map((hospital) => (
              <div 
                key={`list-${hospital.id}`} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  activeRouteId === hospital.id 
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 shadow-md' 
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <h4 className="font-semibold text-slate-800">{hospital.tags?.name || "Unlisted Medical Center"}</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    <span className="font-bold text-indigo-600">{hospital.distance?.toFixed(2)} km</span> away 
                    <span className="mx-2 text-slate-300">•</span> 
                    <span className="capitalize">{hospital.tags?.amenity || 'General Clinic'}</span>
                  </p>
                  
                  {/* Graceful OSRM Rate Limit Error Render */}
                  {routeError === hospital.id && (
                     <p className="text-xs text-rose-500 mt-2 font-medium flex items-center">
                       <MapIcon className="w-3 h-3 mr-1" /> Route unavailable at this time.
                     </p>
                  )}
                </div>
                
                <button 
                  onClick={() => fetchRoute(hospital)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap active:scale-95 ${
                    activeRouteId === hospital.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-300'
                  }`}
                >
                  {activeRouteId === hospital.id ? 'Route Active' : 'Show Route'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
