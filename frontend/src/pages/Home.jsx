import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useAlertRealtime } from '../hooks/useRealtime'
import api from '../lib/api'

const VENUE_ID = '11111111-0000-0000-0000-000000000001'
const EVENT_ID = '66666666-0001-0000-0000-000000000001'

const QUICK_ACTIONS = [
  { icon: '🗺️', label: 'Live Map', to: '/map' },
  { icon: '🍔', label: 'Order Food', to: '/order' },
  { icon: '👥', label: 'CrowdSync', to: '/sync' },
  { icon: '🤖', label: 'SmartBot', to: '/bot' },
  { icon: '🚪', label: 'Exit Plan', to: '/exit' },
  { icon: '🏆', label: 'Fan Score', to: '/score' },
]

export default function Home() {
  const { user } = useAuthStore()
  const [event, setEvent] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, alertRes] = await Promise.all([
          api.get(`/api/events/${EVENT_ID}/timeline`),
          api.get(`/api/events/alerts?venue_id=${VENUE_ID}`)
        ])
        setEvent(eventRes.data.event)
        setAlerts(alertRes.data.alerts?.slice(0, 5) || [])
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    fetchData()
  }, [])

  useAlertRealtime(VENUE_ID, (newAlert) => {
    setAlerts(prev => [newAlert, ...prev].slice(0, 5))
  })

  const score = event?.current_score || {}

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
      {/* Welcome Area */}
      <div>
        <h2 className="font-heading text-4xl text-gray-900 font-bold tracking-wide">
          WELCOME, {(user?.display_name || user?.email?.split('@')[0] || 'FAN').toUpperCase()}
        </h2>
        <p className="text-gray-500 font-bold text-sm mt-1.5 flex items-center gap-1.5">
          <span>🏟️</span>
          <span>Narendra Modi Stadium — Ahmedabad</span>
        </p>
      </div>

      {/* Live Match Card */}
      {event && (
        <div className="bg-gradient-to-r from-[var(--color-accent)] to-[#60a5fa] rounded-2xl p-8 text-white shadow-xl shadow-[var(--color-accent)]/20 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-bold tracking-wider uppercase">Live</span>
          </div>
          
          <p className="text-sm font-semibold opacity-90 uppercase tracking-widest mb-4">
            {event.sport_type} • {event.name}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="font-heading text-3xl font-bold tracking-wider">{event.home_team}</p>
              <p className="font-heading text-5xl mt-2 font-bold tracking-wider">
                {score.home || '-'}
                <span className="text-2xl font-medium opacity-80">/{score.home_wickets || '-'}</span>
              </p>
            </div>
            
            <div className="flex-shrink-0 flex items-center justify-center bg-white/10 rounded-full w-12 h-12 backdrop-blur-md border border-white/20 shadow-inner">
              <span className="font-heading text-xl font-bold tracking-widest text-white/90">VS</span>
            </div>
            
            <div className="text-center flex-1">
              <p className="font-heading text-3xl font-bold tracking-wider">{event.away_team}</p>
              <p className="font-heading text-5xl mt-2 font-bold tracking-wider">
                {score.away || '-'}
                <span className="text-2xl font-medium opacity-80">/{score.away_wickets || '-'}</span>
              </p>
            </div>
          </div>
          
          {score.overs && (
            <div className="mt-6 text-center">
              <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium border border-white/20">
                Overs: {score.overs}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-2xl font-bold text-[var(--color-text-primary)]">QUICK ACTIONS</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map(action => (
            <Link key={action.to} to={action.to}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all text-center group"
            >
              <div className="w-14 h-14 mx-auto rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 group-hover:bg-blue-50 transition-colors">
                <span className="text-3xl block group-hover:scale-110 transition-transform">{action.icon}</span>
              </div>
              <span className="text-sm font-bold text-gray-900 tracking-wide">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Alerts Section */}
      {alerts.length > 0 && (
        <div>
          <h3 className="font-heading text-2xl font-bold mb-4 text-[var(--color-text-primary)]">LATEST ALERTS</h3>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div key={alert.id || i} 
                   className="bg-[var(--color-bg-surface)] rounded-xl px-5 py-4 border-l-4 border-l-[var(--color-warning)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden animate-slide-up" 
                   style={{ animationDelay: `${i * 50}ms` }}>
                <p className="font-bold text-base text-[var(--color-text-primary)]">{alert.title}</p>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1 leading-relaxed">{alert.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
