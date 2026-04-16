import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import { CategoryTag } from '../components/UrgencyBadge'
import EmptyState from '../components/EmptyState'
import { formatDistanceToNow, differenceInMinutes } from 'date-fns'

export default function FixHistory() {
  const [fixes, setFixes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    fetchHistory()
  }, [catFilter])

  async function fetchHistory() {
    let query = supabase
      .from('fixes')
      .select(`
        *,
        creator:created_by(id, name, avatar_id),
        closer:closed_by(id, name, avatar_id)
      `)
      .eq('status', 'closed')
      .not('closed_at', 'is', null)
      .order('closed_at', { ascending: false })
      .limit(50)

    if (catFilter !== 'all') query = query.eq('category', catFilter)

    const { data } = await query

    // Fetch reactions for all fixes
    if (data?.length > 0) {
      const { data: reactions } = await supabase
        .from('reactions')
        .select('*')
        .in('fix_id', data.map(f => f.id))

      const reactionMap = {}
      ;(reactions || []).forEach(r => {
        if (!reactionMap[r.fix_id]) reactionMap[r.fix_id] = []
        reactionMap[r.fix_id].push(r)
      })

      data.forEach(f => { f.reactions = reactionMap[f.id] || [] })
    }

    setFixes(data || [])
    setLoading(false)
  }

  const filtered = search
    ? fixes.filter(f => f.title.toLowerCase().includes(search.toLowerCase()))
    : fixes

  const categories = ['all', 'trash', 'dishes', 'bathroom', 'kitchen', 'grocery', 'general']

  return (
    <div className="page-container">
      <h2 className="page-title">Fix history</h2>
      <p className="page-subtitle">Everything that's been fixed</p>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search fixes..."
          className="input pl-10"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap
              transition-all shrink-0
              ${catFilter === cat
                ? 'bg-blush-100 text-blush-500 ring-1 ring-blush-200'
                : 'bg-cream-200/60 text-gray-500 dark:bg-dark-border dark:text-dark-muted'
              }`}
          >
            {cat === 'all' ? '🔮 All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* History list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="📖" title="No history yet" subtitle="Closed fixes will appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((fix, i) => {
            const duration = fix.closed_at && fix.created_at
              ? differenceInMinutes(new Date(fix.closed_at), new Date(fix.created_at))
              : null
            const durationText = duration !== null
              ? duration < 60 ? `${duration}m` : `${Math.round(duration / 60)}h`
              : null

            return (
              <motion.div
                key={fix.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-dark-text flex-1">
                    {fix.title}
                  </h3>
                  <CategoryTag category={fix.category} />
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-dark-muted mb-2">
                  {fix.creator && (
                    <span className="flex items-center gap-1">
                      <Avatar avatarId={fix.creator.avatar_id} size="xs" />
                      posted by {fix.creator.name?.split(' ')[0]}
                    </span>
                  )}
                  <span>→</span>
                  {fix.closer && (
                    <span className="flex items-center gap-1">
                      <Avatar avatarId={fix.closer.avatar_id} size="xs" />
                      closed by {fix.closer.name?.split(' ')[0]}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-dark-muted">
                    <span>{formatDistanceToNow(new Date(fix.closed_at), { addSuffix: true })}</span>
                    {durationText && (
                      <span className="badge bg-mint-100 text-mint-500 dark:bg-mint-500/10">
                        ⏱ {durationText}
                      </span>
                    )}
                  </div>

                  {fix.reactions?.length > 0 && (
                    <div className="flex gap-0.5">
                      {[...new Set(fix.reactions.map(r => r.emoji))].map(emoji => {
                        const emojiMap = { thumbsup: '👍', fire: '🔥', clap: '👏', heart: '💖', star: '🌟' }
                        const count = fix.reactions.filter(r => r.emoji === emoji).length
                        return (
                          <span key={emoji} className="text-xs bg-cream-100 dark:bg-dark-border px-1.5 py-0.5 rounded-full">
                            {emojiMap[emoji]} {count}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
