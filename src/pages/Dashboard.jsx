import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useUsers } from '../hooks/useFixes'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { getTierInfo } from '../data/avatars'

export default function Dashboard() {
  const { users, loading } = useUsers()
  const [recap, setRecap] = useState(null)
  const [houseStreak, setHouseStreak] = useState(0)

  useEffect(() => {
    fetchRecap()
    calculateStreak()
  }, [])

  async function fetchRecap() {
    const { data } = await supabase
      .from('recaps')
      .select('*')
      .eq('type', 'weekly')
      .order('created_at', { ascending: false })
      .limit(1)

    if (data?.length > 0) setRecap(data[0])
  }

  async function calculateStreak() {
    // Simple streak: count consecutive days with at least one fix closed
    const { data } = await supabase
      .from('fixes')
      .select('closed_at')
      .eq('status', 'closed')
      .not('closed_at', 'is', null)
      .order('closed_at', { ascending: false })
      .limit(100)

    if (!data?.length) return

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i <= 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toDateString()

      const hasClose = data.some(f => new Date(f.closed_at).toDateString() === dateStr)
      if (hasClose) streak++
      else if (i > 0) break // Allow today to not have one yet
    }

    setHouseStreak(streak)
  }

  const sortedUsers = [...users].sort((a, b) => b.weekly_fixes_closed - a.weekly_fixes_closed)
  const topPerformer = sortedUsers[0]

  return (
    <div className="page-container">
      <h2 className="page-title">Dashboard</h2>
      <p className="page-subtitle">How's the crew doing?</p>

      {/* House streak */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-br from-mint-100 to-mint-200 dark:from-mint-500/10 dark:to-mint-500/5
          border-mint-200 dark:border-mint-500/20 mb-5 text-center"
      >
        <span className="text-4xl block mb-1">{houseStreak > 0 ? '🔥' : '💤'}</span>
        <p className="text-3xl font-bold text-mint-500 mb-0.5">
          {houseStreak} day{houseStreak !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-mint-500/70 font-medium">
          {houseStreak > 0 ? 'House fix streak!' : 'No streak yet. Get fixing!'}
        </p>
      </motion.div>

      {/* Weekly leaderboard */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider mb-3">
          Weekly leaderboard
        </h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse h-16" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedUsers.map((u, i) => (
              <LeaderboardRow
                key={u.id}
                user={u}
                rank={i + 1}
                isTop={i === 0 && u.weekly_fixes_closed > 0}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Weekly recap */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider mb-3">
          Weekly recap
        </h3>

        {recap ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-br from-lavender-100 to-blush-100
              dark:from-lavender-400/5 dark:to-blush-500/5
              border-lavender-200 dark:border-lavender-400/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📝</span>
              <h4 className="font-bold text-gray-800 dark:text-dark-text text-sm">
                This week's story
              </h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-dark-text/80 leading-relaxed whitespace-pre-line">
              {recap.content}
            </p>
            {recap.star_performer && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-lavender-200/50 dark:border-dark-border">
                <span className="animate-float">⭐</span>
                <span className="text-xs font-semibold text-lavender-400">
                  Star performer this week
                </span>
              </div>
            )}
          </motion.div>
        ) : (
          <EmptyState
            emoji="📝"
            title="No recap yet"
            subtitle="The weekly recap will appear here every Sunday evening."
          />
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          emoji="🔧"
          label="Total fixes"
          value={users.reduce((sum, u) => sum + u.total_fixes_closed, 0)}
          color="blush"
        />
        <StatCard
          emoji="⭐"
          label="Stars awarded"
          value={users.reduce((sum, u) => sum + u.current_stars, 0)}
          color="peach"
        />
      </div>
    </div>
  )
}

function LeaderboardRow({ user, rank, isTop, index }) {
  const tier = getTierInfo(user.current_stars)
  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`card flex items-center gap-3
        ${isTop ? 'ring-2 ring-yellow-300 dark:ring-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-500/5' : ''}`}
    >
      <span className="text-lg w-7 text-center font-bold text-gray-400">
        {rankEmoji}
      </span>
      <Avatar avatarId={user.avatar_id} size="sm" isStar={isTop} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-800 dark:text-dark-text truncate">
          {user.name?.split(' ')[0]}
        </p>
        <p className="text-xs text-gray-400 dark:text-dark-muted flex items-center gap-1">
          <span>{tier.icon}</span> {tier.name}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-blush-500">{user.weekly_fixes_closed}</p>
        <p className="text-[10px] text-gray-400 dark:text-dark-muted">this week</p>
      </div>
    </motion.div>
  )
}

function StatCard({ emoji, label, value, color }) {
  const colors = {
    blush: 'from-blush-100 to-blush-200/50 dark:from-blush-500/10 dark:to-blush-500/5 border-blush-200 dark:border-blush-500/20',
    peach: 'from-peach-100 to-peach-200/50 dark:from-peach-400/10 dark:to-peach-400/5 border-peach-200 dark:border-peach-400/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card bg-gradient-to-br ${colors[color]} text-center`}
    >
      <span className="text-2xl block mb-1">{emoji}</span>
      <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">{value}</p>
      <p className="text-xs text-gray-500 dark:text-dark-muted font-medium">{label}</p>
    </motion.div>
  )
}
