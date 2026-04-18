import { useState, useEffect } from 'react'
import api from '../lib/api'

const EVENT_ID = '66666666-0001-0000-0000-000000000001'

const BADGE_ICONS = {
  early_bird: '🐦', rally_master: '📍', queue_buster: '⚡',
  social_butterfly: '🦋', foodie: '🍔', explorer: '🧭', helper: '🤝'
}

const ALL_BADGES = [
  { type: 'early_bird', name: 'Early Bird', desc: 'First 1000 at the gate', icon: '🐦' },
  { type: 'rally_master', name: 'Rally Master', desc: 'Set 3 rally points', icon: '📍' },
  { type: 'queue_buster', name: 'Queue Buster', desc: 'Express pickup 3x', icon: '⚡' },
  { type: 'social_butterfly', name: 'Social Butterfly', desc: 'Joined 3 groups', icon: '🦋' },
  { type: 'foodie', name: 'Foodie', desc: '5 food orders', icon: '🍔' },
  { type: 'explorer', name: 'Explorer', desc: 'Checked into 5 zones', icon: '🧭' },
  { type: 'helper', name: 'Helper', desc: 'Responded to SOS', icon: '🤝' },
]

export default function FanScore() {
  const [score, setScore] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scoreRes, lbRes] = await Promise.all([
          api.get(`/api/gamification/score?event_id=${EVENT_ID}`),
          api.get(`/api/gamification/leaderboard?event_id=${EVENT_ID}`)
        ])
        setScore(scoreRes.data)
        setLeaderboard(lbRes.data.leaderboard || [])
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    fetchData()
  }, [])

  const earnedBadgeTypes = new Set(score?.badges?.map(b => b.badge_type) || [])

  if (loading) return <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <h2 className="font-heading text-3xl text-[var(--color-accent)]">🏆 FAN SCORE</h2>

      {/* Score Card */}
      <div className="bg-gradient-to-br from-[var(--color-bg-surface)] to-[var(--color-bg-card)] rounded-2xl p-6 border border-[var(--color-accent)]/20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent" />
        <div className="relative">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Your Fan Score</p>
          <p className="font-heading text-7xl text-[var(--color-accent)]">{score?.total_points || 0}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">Points this event</p>
          {score?.level && (
            <div className="inline-flex items-center gap-2 mt-3 bg-[var(--color-accent)]/10 px-4 py-2 rounded-full">
              <span className="text-xl">{score.level.icon}</span>
              <span className="font-heading text-lg text-[var(--color-accent)]">{score.level.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Points Breakdown */}
      {score?.breakdown && Object.keys(score.breakdown).length > 0 && (
        <div className="bg-[var(--color-bg-surface)] rounded-2xl p-5 border border-[var(--color-border)]">
          <h3 className="font-heading text-lg mb-3 text-[var(--color-text-secondary)]">POINTS BREAKDOWN</h3>
          <div className="space-y-2">
            {Object.entries(score.breakdown).map(([action, pts]) => (
              <div key={action} className="flex items-center justify-between py-1.5">
                <span className="text-sm capitalize text-[var(--color-text-secondary)]">{action.replace(/_/g, ' ')}</span>
                <span className="font-heading text-lg text-[var(--color-success)]">+{pts}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div>
        <h3 className="font-heading text-xl mb-3 text-[var(--color-text-secondary)]">BADGES</h3>
        <div className="grid grid-cols-2 gap-3">
          {ALL_BADGES.map(badge => {
            const earned = earnedBadgeTypes.has(badge.type)
            return (
              <div key={badge.type} className={`rounded-xl p-4 border text-center transition-all ${earned
                ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30'
                : 'bg-[var(--color-bg-card)] border-[var(--color-border)] opacity-40'
              }`}>
                <span className="text-3xl block mb-1">{badge.icon}</span>
                <p className="font-semibold text-xs">{badge.name}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{badge.desc}</p>
                {earned && <span className="text-[10px] text-[var(--color-accent)] mt-1 block">✓ Earned</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h3 className="font-heading text-xl mb-3 text-[var(--color-text-secondary)]">LEADERBOARD</h3>
        {leaderboard.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm text-center py-4">No leaderboard data yet. Start earning points!</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className={`flex items-center justify-between bg-[var(--color-bg-surface)] rounded-xl px-4 py-3 border ${entry.rank <= 3 ? 'border-[var(--color-accent)]/30' : 'border-[var(--color-border)]'}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-heading text-xl w-8 text-center ${entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-gray-400' : entry.rank === 3 ? 'text-amber-600' : 'text-[var(--color-text-muted)]'}`}>
                    {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank-1] : `#${entry.rank}`}
                  </span>
                  <span className="text-sm">{entry.user_id?.slice(0, 8)}...</span>
                </div>
                <span className="font-heading text-lg text-[var(--color-accent)]">{entry.total_points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
