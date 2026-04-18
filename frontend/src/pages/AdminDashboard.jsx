import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../lib/api'

const VENUE_ID = '11111111-0000-0000-0000-000000000001'
const EVENT_ID = '66666666-0001-0000-0000-000000000001'

const DENSITY_COLORS = { low: '#00ff87', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' }
const STATUS_COLORS = { pending: '#f59e0b', preparing: '#00e5ff', ready: '#00ff87', collected: '#8888a0' }

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [alertForm, setAlertForm] = useState({ title: '', body: '', alert_type: 'info' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, ordRes] = await Promise.all([
          api.get(`/api/admin/dashboard?venue_id=${VENUE_ID}`),
          api.get('/api/admin/orders?status=pending')
        ])
        setDashboard(dashRes.data)
        setOrders(ordRes.data.orders || [])
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    fetchData()
  }, [])

  const sendAlert = async () => {
    if (!alertForm.title || !alertForm.body) return
    try {
      await api.post('/api/admin/alerts/push', { ...alertForm, venue_id: VENUE_ID, event_id: EVENT_ID })
      setAlertForm({ title: '', body: '', alert_type: 'info' })
    } catch (err) { console.error(err) }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch (err) { console.error(err) }
  }

  const updateDensity = async (zoneId, level) => {
    try {
      await api.patch(`/api/admin/density/${zoneId}`, { density_level: level, occupancy_count: 0 })
    } catch (err) { console.error(err) }
  }

  if (loading) return <div className="text-center text-[var(--color-text-muted)] py-12">Loading dashboard...</div>

  const zoneChartData = dashboard?.zones?.map(z => ({
    name: z.zone_code || z.name,
    occupancy: z.density?.occupancy_count || 0,
    capacity: z.capacity || 0
  })) || []

  const densityPieData = Object.entries(
    (dashboard?.zones || []).reduce((acc, z) => {
      const level = z.density?.density_level || 'low'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const TABS = ['overview', 'heatmap', 'orders', 'alerts']

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-3xl text-[var(--color-accent)]">🛡️ ADMIN DASHBOARD</h2>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" /> Live
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all whitespace-nowrap ${tab === t ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-bold' : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Occupancy', value: dashboard?.total_occupancy?.toLocaleString() || '0', icon: '👥', color: 'var(--color-accent)' },
              { label: 'Active Orders', value: dashboard?.active_orders_count || 0, icon: '📦', color: 'var(--color-warning)' },
              { label: 'Avg Wait Time', value: `${dashboard?.stats?.avg_wait || 0}m`, icon: '⏱️', color: 'var(--color-success)' },
              { label: 'Zones', value: dashboard?.stats?.total_zones || 0, icon: '🗺️', color: '#a78bfa' },
            ].map(stat => (
              <div key={stat.label} className="bg-[var(--color-bg-surface)] rounded-xl p-4 border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{stat.label}</span>
                </div>
                <p className="font-heading text-3xl" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Zone Occupancy Chart */}
          <div className="bg-[var(--color-bg-surface)] rounded-2xl p-5 border border-[var(--color-border)]">
            <h3 className="font-heading text-lg mb-4 text-[var(--color-text-secondary)]">ZONE OCCUPANCY</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={zoneChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="name" stroke="#8888a0" fontSize={12} />
                <YAxis stroke="#8888a0" fontSize={12} />
                <Tooltip contentStyle={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#f0f0f5' }} />
                <Bar dataKey="occupancy" fill="#00e5ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Density Pie */}
          <div className="bg-[var(--color-bg-surface)] rounded-2xl p-5 border border-[var(--color-border)]">
            <h3 className="font-heading text-lg mb-4 text-[var(--color-text-secondary)]">DENSITY DISTRIBUTION</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={densityPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {densityPieData.map((entry) => (
                    <Cell key={entry.name} fill={DENSITY_COLORS[entry.name] || '#8888a0'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#f0f0f5' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* HEATMAP */}
      {tab === 'heatmap' && (
        <div className="space-y-3">
          <h3 className="font-heading text-lg text-[var(--color-text-secondary)]">ZONE DENSITY CONTROL</h3>
          {dashboard?.zones?.filter(z => z.zone_type !== 'facility').map(zone => (
            <div key={zone.id} className="bg-[var(--color-bg-surface)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{zone.name} ({zone.zone_code})</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Occupancy: {zone.density?.occupancy_count || 0} / {zone.capacity}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-md text-xs font-bold capitalize"
                  style={{ background: DENSITY_COLORS[zone.density?.density_level || 'low'] + '20', color: DENSITY_COLORS[zone.density?.density_level || 'low'] }}>
                  {zone.density?.density_level || 'low'}
                </span>
              </div>
              <div className="flex gap-1.5">
                {Object.keys(DENSITY_COLORS).map(level => (
                  <button key={level} onClick={() => updateDensity(zone.id, level)}
                    className="flex-1 py-1.5 rounded-lg text-xs capitalize transition-all border"
                    style={{ borderColor: DENSITY_COLORS[level] + '40', color: DENSITY_COLORS[level] }}>
                    {level}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS */}
      {tab === 'orders' && (
        <div className="space-y-3">
          <h3 className="font-heading text-lg text-[var(--color-text-secondary)]">PENDING ORDERS</h3>
          {orders.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-sm text-center py-4">No pending orders</p>
          ) : orders.map(order => (
            <div key={order.id} className="bg-[var(--color-bg-surface)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-heading text-lg">{order.order_number}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">₹{parseFloat(order.total_amount).toFixed(2)} • {order.delivery_type} {order.seat_number ? `• Seat: ${order.seat_number}` : ''}</p>
                </div>
                <span className="px-2 py-1 rounded-md text-xs font-bold capitalize" style={{ background: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}>
                  {order.status}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {['preparing', 'ready', 'collected'].map(s => (
                  <button key={s} onClick={() => updateOrderStatus(order.id, s)}
                    className="flex-1 py-1.5 rounded-lg text-xs capitalize bg-[var(--color-bg-card)] hover:bg-[var(--color-accent)]/20 hover:text-[var(--color-accent)] transition-colors border border-[var(--color-border)]">
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALERTS */}
      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-[var(--color-bg-surface)] rounded-2xl p-5 border border-[var(--color-border)] space-y-3">
            <h3 className="font-heading text-lg">📢 PUSH ALERT</h3>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Title</label>
              <input value={alertForm.title} onChange={e => setAlertForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm mt-1 focus:border-[var(--color-accent)] focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Message</label>
              <textarea value={alertForm.body} onChange={e => setAlertForm(p => ({ ...p, body: e.target.value }))} rows={3}
                className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm mt-1 focus:border-[var(--color-accent)] focus:outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Type</label>
              <select value={alertForm.alert_type} onChange={e => setAlertForm(p => ({ ...p, alert_type: e.target.value }))}
                className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm mt-1 focus:border-[var(--color-accent)] focus:outline-none">
                <option value="info">ℹ️ Info</option>
                <option value="crowd_warning">⚠️ Crowd Warning</option>
                <option value="queue_tip">🍔 Queue Tip</option>
                <option value="score">🏏 Score Update</option>
              </select>
            </div>
            <button onClick={sendAlert}
              className="w-full bg-[var(--color-accent)] text-[var(--color-bg-primary)] py-3 rounded-xl font-bold font-heading tracking-wider hover:bg-[var(--color-accent-dark)] transition-colors">
              SEND ALERT
            </button>
          </div>

          {/* Recent Alerts */}
          <div className="space-y-2">
            <h3 className="font-heading text-lg text-[var(--color-text-secondary)]">RECENT ALERTS</h3>
            {dashboard?.recent_alerts?.map((a, i) => (
              <div key={a.id || i} className="bg-[var(--color-bg-card)] rounded-xl px-4 py-3 border border-[var(--color-border)]">
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
