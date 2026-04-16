import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useFixes, useUsers } from '../hooks/useFixes'
import FixCard from '../components/FixCard'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'
import toast from 'react-hot-toast'

export default function Grocery() {
  const { user, profile, updateProfile } = useAuth()
  const { fixes, loading, refetch } = useFixes({ category: 'grocery' })
  const { users } = useUsers()
  const [reactions, setReactions] = useState({})

  const headingOutUser = users.find(u => u.heading_out && u.id !== user?.id)
  const iAmHeadingOut = profile?.heading_out

  useEffect(() => {
    async function fetchReactions() {
      if (fixes.length === 0) return
      const { data } = await supabase
        .from('reactions')
        .select('*')
        .in('fix_id', fixes.map(f => f.id))
      const grouped = {}
      ;(data || []).forEach(r => {
        if (!grouped[r.fix_id]) grouped[r.fix_id] = []
        grouped[r.fix_id].push(r)
      })
      setReactions(grouped)
    }
    fetchReactions()
  }, [fixes])

  async function toggleHeadingOut() {
    const newVal = !iAmHeadingOut
    await updateProfile({ heading_out: newVal })
    toast.success(newVal ? "Your roommates will be notified!" : "Welcome back!")
  }

  async function handleReact(fixId, userId, emoji) {
    const existing = (reactions[fixId] || []).find(r => r.user_id === userId && r.emoji === emoji)
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({ fix_id: fixId, user_id: userId, emoji })
    }
    const { data } = await supabase.from('reactions').select('*').in('fix_id', fixes.map(f => f.id))
    const grouped = {}
    ;(data || []).forEach(r => {
      if (!grouped[r.fix_id]) grouped[r.fix_id] = []
      grouped[r.fix_id].push(r)
    })
    setReactions(grouped)
  }

  const openFixes = fixes.filter(f => f.status === 'open')
  const claimedFixes = fixes.filter(f => f.status === 'claimed')

  return (
    <div className="page-container">
      <h2 className="page-title">Grocery tracker</h2>
      <p className="page-subtitle">What do we need from the store?</p>

      {/* Heading out banner */}
      {headingOutUser && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-peach-100 to-peach-200 dark:from-peach-400/10 dark:to-peach-400/5
            border-peach-200 dark:border-peach-400/20 mb-4"
        >
          <div className="flex items-center gap-3">
            <Avatar avatarId={headingOutUser.avatar_id} size="sm" />
            <div>
              <p className="text-sm font-bold text-peach-400">
                {headingOutUser.name?.split(' ')[0]} is heading out! 🏃‍♀️
              </p>
              <p className="text-xs text-peach-400/70">Add your grocery fixes now!</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Heading out toggle */}
      <button
        onClick={toggleHeadingOut}
        className={`w-full card mb-5 flex items-center justify-between transition-all
          ${iAmHeadingOut
            ? 'ring-2 ring-mint-300 dark:ring-mint-500/30 bg-mint-50 dark:bg-mint-500/5'
            : ''}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{iAmHeadingOut ? '🏃‍♀️' : '🚪'}</span>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-800 dark:text-dark-text">
              {iAmHeadingOut ? "You're heading out!" : "I'm heading out"}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-muted">
              {iAmHeadingOut ? 'Tap to cancel' : 'Let everyone know you\'re going to the store'}
            </p>
          </div>
        </div>
        <div className={`w-12 h-7 rounded-full transition-colors duration-200 flex items-center px-1
          ${iAmHeadingOut ? 'bg-mint-400' : 'bg-cream-300 dark:bg-dark-border'}`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
            ${iAmHeadingOut ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      </button>

      {/* Grocery fixes */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : openFixes.length === 0 && claimedFixes.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Nothing needed"
          subtitle="No grocery items right now. Post a fix with the grocery category to add one!"
        />
      ) : (
        <div className="space-y-3">
          {[...openFixes, ...claimedFixes].map(fix => (
            <FixCard
              key={fix.id}
              fix={fix}
              reactions={reactions[fix.id] || []}
              onReact={handleReact}
              onRefetch={refetch}
            />
          ))}
        </div>
      )}
    </div>
  )
}
