import { useState, useEffect } from 'react'
import { useAlertRealtime } from '../hooks/useRealtime'
import api from '../lib/api'

const VENUE_ID = '11111111-0000-0000-0000-000000000001'
const EVENT_ID = '66666666-0001-0000-0000-000000000001'

const ALERT_ICONS = { score: '🏏', crowd_warning: '⚠️', queue_tip: '🍔', order_ready: '✅', info: 'ℹ️', group_pulse: '👥', sos: '🚨' }
const ALERT_COLORS = { score: 'var(--color-accent)', crowd_warning: 'var(--color-warning)', queue_tip: 'var(--color-success)', order_ready: 'var(--color-success)', sos: 'var(--color-danger)', info: 'var(--color-text-secondary)', group_pulse: '#a78bfa' }

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [timeline, setTimeline] = useState([])
  const [event, setEvent] = useState(null)
  const [tab, setTab] = useState('alerts')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertRes, tlRes] = await Promise.all([
          api.get(`/api/events/alerts?venue_id=${VENUE_ID}`),
          api.get(`/api/events/${EVENT_ID}/timeline`)
        ])
        setAlerts(alertRes.data.alerts || [])
        setTimeline(tlRes.data.timeline || [])
        setEvent(tlRes.data.event)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    fetchData()
  }, [])

  useAlertRealtime(VENUE_ID, (newAlert) => {
    setAlerts(prev => [newAlert, ...prev])
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <h2 className="font-heading text-3xl text-[var(--color-accent)]">📢 ALERTS & TIMELINE</h2>

      {/* Tabs */}
      <div className="flex gap-2">
        {['alerts', 'timeline'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl font-heading text-lg tracking-wider transition-all ${tab === t ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]'}`}>
            {t === 'alerts' ? '🔔 ALERTS' : '📅 TIMELINE'}
          </button>
        ))}
      </div>

      {tab === 'alerts' && (
        <div className="space-y-2">
          {alerts.length === 0 && !loading && <p className="text-[var(--color-text-muted)] text-sm text-center py-8">No alerts yet</p>}
          {alerts.map((alert, i) => (
            <div key={alert.id || i}
              className="bg-[var(--color-bg-surface)] rounded-xl px-4 py-4 border border-[var(--color-border)] animate-slide-up"
              style={{ animationDelay: `${i * 30}ms`, borderLeftWidth: '3px', borderLeftColor: ALERT_COLORS[alert.alert_type] || 'var(--color-border)' }}>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{ALERT_ICONS[alert.alert_type] || 'ℹ️'}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{alert.body}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
                    {new Date(alert.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-3">
          {event && (
            <div className="bg-[var(--color-bg-surface)] rounded-xl px-4 py-3 border border-[var(--color-accent)]/20 text-center">
              <p className="font-heading text-lg text-[var(--color-accent)]">{event.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{event.home_team} vs {event.away_team}</p>
            </div>
          )}
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[var(--color-border)]" />
            {timeline.map((item, i) => {
              const isPast = new Date(item.scheduled_time) < new Date()
              return (
                <div key={item.id || i} className="relative mb-4">
                  <div className={`absolute left-[-21px] w-4 h-4 rounded-full border-2 ${isPast ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'bg-[var(--color-bg-card)] border-[var(--color-border)]'}`} />
                  <div className={`bg-[var(--color-bg-surface)] rounded-xl px-4 py-3 border ${isPast ? 'border-[var(--color-accent)]/20' : 'border-[var(--color-border)]'}`}>
                    <p className={`font-semibold text-sm ${isPast ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>{item.title}</p>
                    {item.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.description}</p>}
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                      {new Date(item.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading && <div className="text-center text-[var(--color-text-muted)] py-8">Loading...</div>}
    </div>
  )
}
