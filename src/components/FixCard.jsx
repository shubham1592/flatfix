import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import UrgencyBadge, { CategoryTag } from './UrgencyBadge'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const reactionEmojis = [
  { key: 'thumbsup', icon: '👍' },
  { key: 'fire', icon: '🔥' },
  { key: 'clap', icon: '👏' },
  { key: 'heart', icon: '💖' },
  { key: 'star', icon: '🌟' },
]

export default function FixCard({ fix, reactions = [], onReact, onRefetch }) {
  const { user } = useAuth()
  const [showReactions, setShowReactions] = useState(false)
  const [acting, setActing] = useState(false)

  const timeAgo = formatDistanceToNow(new Date(fix.created_at), { addSuffix: true })
  const isMine = user?.id === fix.created_by
  const isClaimed = fix.status === 'claimed'
  const isClosed = fix.status === 'closed'
  const myClaimedFix = isClaimed && fix.claimed_by === user?.id

  async function claimFix() {
    setActing(true)
    const { error } = await supabase
      .from('fixes')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', fix.id)
      .eq('status', 'open')

    if (error) toast.error('Could not claim this fix')
    else toast.success('You claimed this fix!')
    setActing(false)
    onRefetch?.()
  }

  async function closeFix() {
    setActing(true)
    const { error } = await supabase
      .from('fixes')
      .update({
        status: 'closed',
        closed_by: user.id,
        closed_at: new Date().toISOString(),
      })
      .eq('id', fix.id)

    if (error) toast.error('Could not close this fix')
    else toast.success('Fix closed! Nice work ✨')
    setActing(false)
    onRefetch?.()
  }

  async function sendNudge() {
    if (!fix.claimed_by || fix.claimed_by === user?.id) return

    const { data: existing } = await supabase
      .from('nudges')
      .select('id')
      .eq('from_user_id', user.id)
      .eq('fix_id', fix.id)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())

    if (existing?.length > 0) {
      toast('You already nudged for this fix today', { icon: '⏳' })
      return
    }

    await supabase.from('nudges').insert({
      fix_id: fix.id,
      from_user_id: user.id,
      to_user_id: fix.claimed_by,
    })
    toast.success('Nudge sent anonymously!')
  }

  async function deleteFix() {
    if (!confirm('Delete this fix?')) return
    await supabase.from('fixes').delete().eq('id', fix.id)
    toast.success('Fix deleted')
    onRefetch?.()
  }

  const reactionCounts = reactionEmojis.map(e => ({
    ...e,
    count: reactions.filter(r => r.emoji === e.key).length,
    mine: reactions.some(r => r.emoji === e.key && r.user_id === user?.id),
  }))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="card hover:shadow-soft-md group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 dark:text-dark-text truncate">
            {fix.title}
          </h3>
          {fix.description && (
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5 line-clamp-2">
              {fix.description}
            </p>
          )}
        </div>
        <UrgencyBadge urgency={fix.urgency} />
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <CategoryTag category={fix.category} />
        {fix.location && fix.location !== 'general' && (
          <span className="badge bg-lavender-100 text-lavender-400 dark:bg-dark-border dark:text-lavender-300">
            📍 {fix.location}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {fix.creator && (
            <div className="flex items-center gap-1.5">
              <Avatar avatarId={fix.creator.avatar_id} size="xs" />
              <span className="text-xs text-gray-500 dark:text-dark-muted">
                {fix.creator.name?.split(' ')[0]}
              </span>
            </div>
          )}
          <span className="text-xs text-gray-400 dark:text-dark-muted">
            {timeAgo}
          </span>
        </div>

        {isClaimed && fix.claimer && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-blush-400">claimed by</span>
            <Avatar avatarId={fix.claimer.avatar_id} size="xs" />
            <span className="text-xs font-medium text-blush-500">
              {fix.claimer.name?.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream-200 dark:border-dark-border">
        {fix.status === 'open' && (
          <>
            <button onClick={claimFix} disabled={acting} className="btn-primary text-sm py-2 px-4 flex-1">
              {acting ? '...' : '🙋 Claim'}
            </button>
            {isMine && (
              <button onClick={deleteFix} className="btn-ghost text-sm py-2 px-3">
                🗑️
              </button>
            )}
          </>
        )}

        {myClaimedFix && (
          <button onClick={closeFix} disabled={acting} className="btn-secondary text-sm py-2 px-4 flex-1">
            {acting ? '...' : '✅ Done!'}
          </button>
        )}

        {isClaimed && !myClaimedFix && fix.claimed_by !== user?.id && (
          <button onClick={sendNudge} className="btn-ghost text-sm py-2 px-3">
            👉 Nudge
          </button>
        )}

        {isClosed && (
          <div className="flex items-center gap-1 flex-wrap flex-1">
            {reactionCounts.map(r => (
              <button
                key={r.key}
                onClick={() => onReact?.(fix.id, user?.id, r.key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all duration-150
                  ${r.mine
                    ? 'bg-blush-100 ring-1 ring-blush-300 scale-105'
                    : 'bg-cream-100 hover:bg-cream-200 dark:bg-dark-border dark:hover:bg-dark-bg'
                  } active:scale-95`}
              >
                <span>{r.icon}</span>
                {r.count > 0 && (
                  <span className="text-xs font-semibold text-gray-600 dark:text-dark-muted">
                    {r.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
