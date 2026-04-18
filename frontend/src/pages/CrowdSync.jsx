import { useState, useEffect } from 'react'
import { useSyncStore } from '../store/useSyncStore'
import { useSyncGroupRealtime } from '../hooks/useRealtime'
import { useAuthStore } from '../store/useAuthStore'
import api from '../lib/api'

const VENUE_ID = '11111111-0000-0000-0000-000000000001'
const EVENT_ID = '66666666-0001-0000-0000-000000000001'

const STATUS_COLORS = { active: '#22c55e', distress: '#ef4444', away: '#94a3b8' }

export default function CrowdSync() {
  const { currentGroup, members, setGroup, setMembers, updateMember, addMember, reset } = useSyncStore()
  const { user } = useAuthStore()
  const [joinCode, setJoinCode] = useState('')
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [pulseMsg, setPulseMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState([])

  useEffect(() => {
    api.get(`/api/venues/${VENUE_ID}/zones`).then(r => setZones(r.data.zones)).catch(() => {})
  }, [])

  useSyncGroupRealtime(currentGroup?.id, (updated) => {
    if (members.some(m => m.user_id === updated.user_id)) {
      updateMember(updated)
    } else {
      addMember(updated)
    }
  })

  const createGroup = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/sync/create', { venue_id: VENUE_ID, event_id: EVENT_ID, display_name: displayName || 'Host' })
      setGroup(res.data.group)
      const groupRes = await api.get(`/api/sync/group/${res.data.code}`)
      setMembers(groupRes.data.members)
    } catch (err) { setError(err.response?.data?.error || 'Failed to create group') }
    setLoading(false)
  }

  const joinGroup = async () => {
    if (!joinCode.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/sync/join', { code: joinCode.toUpperCase(), display_name: displayName || 'Member' })
      setGroup(res.data.group)
      const groupRes = await api.get(`/api/sync/group/${joinCode.toUpperCase()}`)
      setMembers(groupRes.data.members)
    } catch (err) { setError(err.response?.data?.error || 'Failed to join group') }
    setLoading(false)
  }

  const updateLocation = async (zoneId) => {
    if (!currentGroup) return
    try { await api.patch('/api/sync/location', { zone_id: zoneId, group_id: currentGroup.id }) } catch (err) { console.error(err) }
  }

  const sendPulse = async () => {
    if (!pulseMsg.trim() || !currentGroup) return
    try { await api.post('/api/sync/pulse', { message: pulseMsg, group_id: currentGroup.id }); setPulseMsg('') } catch (err) { console.error(err) }
  }

  const sendSOS = async () => {
    if (!currentGroup) return
    try { await api.post('/api/sync/sos', { group_id: currentGroup.id }) } catch (err) { console.error(err) }
  }

  if (!currentGroup) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8 animate-fade-in pb-32">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-600/30 mx-auto mb-4 transform -rotate-3 hover:rotate-0 transition-transform">
            👥
          </div>
          <h2 className="font-heading text-4xl tracking-wide text-gray-900 drop-shadow-sm">CROWDSYNC</h2>
          <p className="text-gray-500 font-medium tracking-wide mt-2">Coordinate with your group in real-time. Zone-level privacy guaranteed.</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-blue-600" />
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Your Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="E.g. Squad Leader" 
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm" />
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
            <h3 className="font-heading text-2xl text-gray-900 mb-2">CREATE NEW GROUP</h3>
            <p className="text-sm font-medium text-gray-500 mb-4">Start a new group and get a 6-digit code to share.</p>
            <button onClick={createGroup} disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:active:scale-100 font-heading text-xl tracking-wider">
              {loading ? '...' : 'CREATE GROUP'}
            </button>
          </div>

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gray-200" /><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">OR JOIN</span><div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100/50">
            <h3 className="font-heading text-2xl text-gray-900 mb-2">JOIN GROUP</h3>
            <div className="flex flex-col gap-3">
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE" maxLength={6}
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-center text-3xl font-heading tracking-[0.4em] text-green-700 placeholder:text-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none shadow-sm uppercase uppercase" />
              <button onClick={joinGroup} disabled={loading || joinCode.length < 6}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:active:scale-100 font-heading text-xl tracking-wider">
                {loading ? '...' : 'JOIN NOW'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-bold text-center animate-shake">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-fade-in pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-600/30">👥</div>
          <h2 className="font-heading text-3xl text-gray-900 tracking-wide">CROWDSYNC</h2>
        </div>
        <button onClick={reset} className="text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
          Leave Group
        </button>
      </div>

      {/* Group Code */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/50 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Active Group Code</p>
        <div className="inline-block relative">
          <p className="font-heading text-7xl text-blue-600 tracking-[0.3em] font-bold z-10 relative">
            {currentGroup.code}
          </p>
          <div className="absolute inset-0 bg-blue-400 opacity-20 blur-xl rounded-full" />
        </div>
        <p className="text-sm font-medium text-gray-500 mt-2">Share this code with your group</p>
      </div>

      {/* Members */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-200/40">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <h3 className="font-heading text-xl text-gray-900">MEMBERS ({members.length})</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members.map(member => (
            <div key={member.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center justify-between hover:border-blue-200 transition-colors shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-gray-500 text-lg">
                    {member.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white" style={{ background: STATUS_COLORS[member.status] }} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{member.display_name}</p>
                  {member.zones?.name ? (
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">📍 {member.zones.name}</p>
                  ) : (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Location Unknown</p>
                  )}
                  {member.pulse_message && <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1.5 inline-block">💬 {member.pulse_message}</p>}
                </div>
              </div>
              <span className="text-xs font-bold uppercase px-3 py-1.5 rounded-lg tracking-wider border shadow-sm" style={{ background: STATUS_COLORS[member.status] + '15', color: STATUS_COLORS[member.status], borderColor: STATUS_COLORS[member.status] + '30' }}>
                {member.status === 'distress' ? '🚨 SOS' : member.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zone Check-in */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-200/40">
          <h3 className="font-heading text-xl mb-4 text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2"><span>📍</span> LOCATION UPDATE</h3>
          <div className="grid grid-cols-3 gap-2">
            {zones.filter(z => z.zone_type !== 'facility').map(zone => (
              <button key={zone.id} onClick={() => updateLocation(zone.id)}
                className="bg-gray-50 rounded-xl px-3 py-3 text-xs font-bold text-center text-gray-600 hover:bg-blue-600 hover:text-white transition-all border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95">
                {zone.zone_code}
              </button>
            ))}
          </div>
        </div>

        {/* Pulse */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-200/40">
          <h3 className="font-heading text-xl mb-4 text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2"><span>📢</span> GROUP MESSAGE</h3>
          <div className="flex flex-col gap-3">
            <input value={pulseMsg} onChange={e => setPulseMsg(e.target.value)}
              placeholder="e.g. Meet at Gate C!" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm" />
            <button onClick={sendPulse} 
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-blue-700 transition-all shadow-md shadow-blue-600/30 active:scale-95">
              Send Broadcast
            </button>
          </div>
        </div>
      </div>

      {/* SOS */}
      <button onClick={sendSOS}
        className="w-full bg-red-50 hover:bg-red-600 hover:text-white border-2 border-red-600 text-red-600 font-heading tracking-widest text-2xl py-6 rounded-3xl transition-all shadow-xl hover:shadow-red-600/30 active:scale-95 flex items-center justify-center gap-3 group">
        <span className="text-4xl group-hover:animate-ping">🚨</span> 
        <span>SEND EMERGENCY SOS</span>
      </button>
    </div>
  )
}
