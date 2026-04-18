import { useState, useEffect } from 'react'
import { useVenueStore } from '../store/useVenueStore'
import { useQueueRealtime, useCrowdDensityRealtime } from '../hooks/useRealtime'
import api from '../lib/api'

const VENUE_ID = '11111111-0000-0000-0000-000000000001'

const DENSITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' }
const DENSITY_OPACITY = { low: 0.15, medium: 0.25, high: 0.35, critical: 0.45 }
const POI_ICONS = { gate: '🚪', restroom: '🚻', concession: '🍔', firstaid: '🏥', exit: '🚶', atm: '💳' }
const QUEUE_COLORS = (wait) => wait < 3 ? '#22c55e' : wait < 8 ? '#f59e0b' : wait < 15 ? '#ef4444' : '#7c3aed'

const FILTERS = [
  { key: null, label: 'All' },
  { key: 'concession', label: '🍔 Food' },
  { key: 'restroom', label: '🚻 Restrooms' },
  { key: 'gate', label: '🚪 Gates' },
  { key: 'exit', label: '🚶 Exits' },
  { key: 'firstaid', label: '🏥 First Aid' },
]

export default function VenueDashboard() {
  const { zones, pois, setZones, setPois, updateQueue, updateZoneDensity, filterType, setFilterType, selectedPoi, setSelectedPoi } = useVenueStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await api.get(`/api/venues/${VENUE_ID}/map`)
        setZones(res.data.zones)
        setPois(res.data.pois)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    fetchMap()
  }, [])

  useQueueRealtime(VENUE_ID, updateQueue)
  useCrowdDensityRealtime(VENUE_ID, updateZoneDensity)

  const filteredPois = filterType ? pois.filter(p => p.poi_type === filterType) : pois

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6 animate-fade-in relative pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="font-heading text-4xl font-bold tracking-wide text-[var(--color-text-primary)]">LIVE MAP</h2>
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {FILTERS.map(f => (
            <button key={f.label} onClick={() => setFilterType(f.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shadow-sm snap-start ${filterType === f.key
                ? 'bg-blue-600 text-white shadow-blue-600/30 shadow-md scale-105 border border-blue-500'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 hover:shadow-md'
              }`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl shadow-gray-200/50 relative group">
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm z-10 hidden md:block">
          <p className="text-xs font-bold text-gray-500 tracking-wider">MAP VIEW</p>
        </div>
        
        <svg viewBox="0 0 1200 800" className="w-full h-auto cursor-crosshair min-h-[50vh]">
          <defs>
            {/* Bright, clean field gradient for light mode */}
            <radialGradient id="fieldGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.1" />
            </radialGradient>
            <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.06"/>
            </filter>
            <filter id="glow-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="8" floodColor="#2563eb" floodOpacity="0.2"/>
            </filter>
          </defs>

          {/* Background */}
          <rect width="1200" height="800" fill="#f8fafc" />

          {/* Grid lines to make it look technical and premium */}
          <g stroke="#e2e8f0" strokeWidth="1" opacity="0.5">
            <line x1="0" y1="200" x2="1200" y2="200" />
            <line x1="0" y1="400" x2="1200" y2="400" />
            <line x1="0" y1="600" x2="1200" y2="600" />
            <line x1="300" y1="0" x2="300" y2="800" />
            <line x1="600" y1="0" x2="600" y2="800" />
            <line x1="900" y1="0" x2="900" y2="800" />
          </g>

          {/* Zones */}
          {zones.map(zone => {
            const c = zone.map_coordinates || {}
            const density = zone.density?.density_level || 'low'
            const isField = zone.zone_type === 'facility'
            
            return (
              <g key={zone.id}>
                <rect
                  x={c.x} y={c.y} width={c.width} height={c.height}
                  fill={isField ? 'url(#fieldGrad)' : DENSITY_COLORS[density]}
                  fillOpacity={isField ? 1 : DENSITY_OPACITY[density]}
                  stroke={isField ? '#22c55e' : DENSITY_COLORS[density]}
                  strokeWidth={isField ? 2 : 1.5}
                  rx="12"
                  filter={isField ? "" : "url(#drop-shadow)"}
                  className="transition-all duration-700 ease-in-out"
                />
                
                {/* Zone Label Background for contrast */}
                <rect 
                  x={c.x + c.width / 2 - 40} y={c.y + c.height / 2 - 12} 
                  width="80" height="24" rx="12" 
                  fill={isField ? '#16a34a' : 'white'} 
                  opacity={isField ? 0.9 : 0.85} 
                />
                <text
                  x={c.x + c.width / 2} y={c.y + c.height / 2 + 1}
                  textAnchor="middle" dominantBaseline="central"
                  fill={isField ? 'white' : '#0f172a'}
                  fontSize={isField ? 15 : 12}
                  fontFamily="DM Sans" fontWeight="700"
                  letterSpacing="0.05em"
                >
                  {isField ? 'PITCH' : zone.zone_code}
                </text>

                {!isField && (
                  <text
                    x={c.x + c.width / 2} y={c.y + c.height / 2 + 22}
                    textAnchor="middle" fill={DENSITY_COLORS[density]}
                    fontSize="10" fontFamily="DM Sans" fontWeight="800"
                    letterSpacing="0.05em"
                  >
                    {density.toUpperCase()}
                  </text>
                )}
              </g>
            )
          })}

          {/* POIs */}
          {filteredPois.map(poi => {
            const queue = poi.queue || {}
            const wait = queue.estimated_wait_minutes
            const hasWait = wait != null
            return (
              <g key={poi.id} onClick={() => setSelectedPoi(poi)} className="cursor-pointer">
                {/* Outer halo for clickable area */}
                <circle cx={poi.map_x} cy={poi.map_y} r={28} fill="transparent" />
                
                <circle
                  cx={poi.map_x} cy={poi.map_y} r={18}
                  fill={hasWait ? QUEUE_COLORS(wait) : 'white'}
                  fillOpacity={hasWait ? 0.15 : 1}
                  stroke={hasWait ? QUEUE_COLORS(wait) : '#cbd5e1'}
                  strokeWidth={hasWait ? 2.5 : 1.5}
                  filter={hasWait ? "url(#glow-shadow)" : "url(#drop-shadow)"}
                  className="transition-all duration-300 transform origin-center hover:scale-125"
                />
                <text x={poi.map_x} y={poi.map_y + 1} textAnchor="middle" dominantBaseline="central" fontSize="18">
                  {POI_ICONS[poi.poi_type] || '📍'}
                </text>
                
                {hasWait && (
                  <g className="translate-y-[26px]">
                    <rect x={poi.map_x - 16} y={poi.map_y - 8} width="32" height="16" rx="8" fill="white" stroke={QUEUE_COLORS(wait)} strokeWidth="1" />
                    <text x={poi.map_x} y={poi.map_y + 1} textAnchor="middle" dominantBaseline="central" fill={QUEUE_COLORS(wait)} fontSize="10" fontWeight="bold" fontFamily="DM Sans">
                      {wait}m
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Density Level</p>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
            {Object.entries(DENSITY_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md shadow-sm" style={{ background: color, border: `1px solid ${color}40` }} />
                <span className="capitalize">{level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected POI Detail Floating Panel */}
      {selectedPoi && (
        <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-5 border border-gray-200 shadow-2xl animate-slide-up z-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-3xl shadow-sm">
                {POI_ICONS[selectedPoi.poi_type] || '📍'}
              </div>
              <div>
                <h3 className="font-heading text-2xl font-bold text-gray-900 leading-none">{selectedPoi.name}</h3>
                <p className="text-sm font-medium text-gray-500 capitalize mt-1 tracking-wide">{selectedPoi.poi_type}</p>
              </div>
            </div>
            <button onClick={() => setSelectedPoi(null)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors">
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {selectedPoi.queue?.estimated_wait_minutes != null && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: QUEUE_COLORS(selectedPoi.queue.estimated_wait_minutes) }}></span>
                  <p className="text-sm font-bold" style={{ color: QUEUE_COLORS(selectedPoi.queue.estimated_wait_minutes) }}>
                    {selectedPoi.queue.estimated_wait_minutes} min wait
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Queue</p>
                  <p className="text-base font-bold text-gray-900">{selectedPoi.queue.queue_length || '0'} pxl</p>
                </div>
              </div>
            )}
            
            {selectedPoi.is_accessible && (
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                <span>♿</span> Wheelchair Accessible
              </div>
            )}
            
            <button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
              <span>Directions</span>
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50 rounded-2xl">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}
