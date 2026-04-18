import { useState, useEffect } from 'react'
import api from '../lib/api'

const VENUE_ID = '11111111-0000-0000-0000-000000000001'

const DENSITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' }

export default function ExitRouting() {
  const [zones, setZones] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [exits, setExits] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/api/venues/${VENUE_ID}/zones`).then(r => setZones(r.data.zones.filter(z => z.zone_type !== 'facility'))).catch(() => {})
  }, [])

  const findBestExit = async (zoneId) => {
    setSelectedZone(zoneId)
    setLoading(true)
    try {
      const res = await api.get(`/api/navigation/exit?zone_id=${zoneId}&venue_id=${VENUE_ID}`)
      setExits(res.data.exits || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-fade-in pb-32">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-600/30">
          🚦
        </div>
        <div>
          <h2 className="font-heading text-4xl tracking-wide text-gray-900">SMART EXIT</h2>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
            Dynamic Crowd-Aware Routing
          </p>
        </div>
      </div>

      {/* Zone Selector */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/50">
        <h3 className="font-heading text-xl mb-4 text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
           <span>📍</span> SELECT DEPARTURE ZONE
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {zones.map(zone => (
            <button key={zone.id} onClick={() => findBestExit(zone.id)}
              className={`py-4 px-4 rounded-2xl text-sm font-bold transition-all border shadow-sm ${selectedZone === zone.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2 scale-105'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 active:scale-95'
              }`}>
              {zone.zone_code}
              <div className="text-[10px] uppercase opacity-80 mt-1">{zone.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Exit Recommendations */}
      <div className="relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-2xl">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-500 mt-4 uppercase tracking-widest animate-pulse">Calculating via Dijkstra algorithm...</p>
            </div>
          </div>
        )}

        {exits.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-heading text-2xl text-gray-900 pl-2">RECOMMENDED EXITS</h3>
            {exits.map((exit, i) => (
              <div key={i} className={`bg-white rounded-3xl p-6 border shadow-md transition-all ${i === 0 ? 'border-green-300 shadow-green-600/10 hover:shadow-green-600/20 ring-1 ring-green-100' : 'border-gray-100 shadow-gray-200/50 hover:border-blue-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {i === 0 && <span className="bg-green-100 text-green-700 border border-green-200 text-xs px-3 py-1 rounded-lg font-bold shadow-sm uppercase tracking-widest flex items-center gap-1"><span>⭐</span> FASTEST</span>}
                    <h4 className="font-heading text-3xl text-gray-900">{exit.poi?.name || 'Exit Gate'}</h4>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shadow-sm">🚪</div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-xl">🕐</span>
                    <span className="font-bold text-gray-900">~{exit.route?.estimated_minutes || '?'} min</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Walk</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <span className="w-3 h-3 rounded-full animate-pulse shadow-sm" style={{ background: DENSITY_COLORS[exit.exit_density] || DENSITY_COLORS.low }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: DENSITY_COLORS[exit.exit_density] || DENSITY_COLORS.low }}>
                      {exit.exit_density || 'low'} crowd
                    </span>
                  </div>
                </div>
                
                {exit.route?.route_details && (
                  <div className="mt-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Navigation Route</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-700">
                      {exit.route.route_details.map((z, j) => (
                        <div key={j} className="flex items-center gap-2">
                          {j > 0 && <span className="text-blue-400">→</span>}
                          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm hover:scale-105 transition-transform cursor-default">
                            {z.zone_code || z.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {exits.length === 0 && !loading && selectedZone && (
          <div className="text-center py-12 bg-white border border-gray-100 rounded-3xl shadow-sm">
            <span className="text-4xl opacity-50 mb-4 block">🏝️</span>
            <p className="font-bold text-gray-500">No route found from this zone.</p>
          </div>
        )}
      </div>

      {/* Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-400" />
        <p className="text-sm text-yellow-800 font-bold tracking-wide flex items-center gap-2">
           <span className="text-xl">💡</span> PRO TIP
        </p>
        <p className="font-medium text-yellow-700 mt-1 pl-7 leading-relaxed">
          Exit recommendations update in real-time as crowd density changes. Wait until 10 minutes before the match ends for the most accurate route!
        </p>
      </div>
    </div>
  )
}
