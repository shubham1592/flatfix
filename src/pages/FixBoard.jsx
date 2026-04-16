import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useFixes } from '../hooks/useFixes'
import FixCard from '../components/FixCard'
import SmartComposer from '../components/SmartComposer'
import EmptyState from '../components/EmptyState'

const statusTabs = [
  { key: 'open', label: 'Open', emoji: '📬' },
  { key: 'claimed', label: 'Claimed', emoji: '🙋' },
  { key: 'closed', label: 'Done', emoji: '✅' },
]

const categories = ['all', 'trash', 'dishes', 'bathroom', 'kitchen', 'grocery', 'general']
const catEmojis = { all: '🔮', trash: '🗑️', dishes: '🍽️', bathroom: '🚿', kitchen: '🍳', grocery: '🛒', general: '📌' }

export default function FixBoard() {
  const [activeTab, setActiveTab] = useState('open')
  const [activeCat, setActiveCat] = useState('all')
  const [composerOpen, setComposerOpen] = useState(false)
  const [reactions, setReactions] = useState({})

  const filter = {
    status: activeTab === 'closed' ? 'closed' : activeTab,
    ...(activeCat !== 'all' && { category: activeCat }),
  }
  const { fixes, loading, refetch } = useFixes(filter)

  // Fetch reactions for all visible fixes
  useEffect(() => {
    async function fetchReactions() {
      if (fixes.length === 0) return
      const fixIds = fixes.map(f => f.id)
      const { data } = await supabase
        .from('reactions')
        .select('*')
        .in('fix_id', fixIds)
      const grouped = {}
      ;(data || []).forEach(r => {
        if (!grouped[r.fix_id]) grouped[r.fix_id] = []
        grouped[r.fix_id].push(r)
      })
      setReactions(grouped)
    }
    fetchReactions()
  }, [fixes])

  async function handleReact(fixId, userId, emoji) {
    const existing = (reactions[fixId] || []).find(
      r => r.user_id === userId && r.emoji === emoji
    )
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({ fix_id: fixId, user_id: userId, emoji })
    }
    // Refetch reactions
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

  // Sort by urgency (highest first) then by date
  const sortedFixes = [...fixes].sort((a, b) => {
    if (activeTab !== 'closed') return b.urgency - a.urgency || new Date(b.created_at) - new Date(a.created_at)
    return new Date(b.closed_at || b.created_at) - new Date(a.closed_at || a.created_at)
  })

  // For "closed" tab, only show today's closes
  const displayFixes = activeTab === 'closed'
    ? sortedFixes.filter(f => {
        const closed = new Date(f.closed_at)
        const today = new Date()
        return closed.toDateString() === today.toDateString()
      })
    : sortedFixes

  return (
    <div className="page-container">
      <div className="flex items-end justify-between mb-1">
        <div>
          <h2 className="page-title">Fix board</h2>
          <p className="page-subtitle">
            {fixes.length} {activeTab} fix{fixes.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <button
          onClick={() => setComposerOpen(true)}
          className="btn-primary text-sm py-2.5 px-5 mb-5 shadow-glow-pink"
        >
          ✨ New fix
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 bg-cream-200/50 dark:bg-dark-border/50 rounded-full p-1">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-full text-sm font-semibold transition-all duration-200
              ${activeTab === tab.key
                ? 'bg-white dark:bg-dark-card text-blush-500 shadow-soft'
                : 'text-gray-400 dark:text-dark-muted hover:text-gray-600'
              }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold
              whitespace-nowrap transition-all duration-200 shrink-0
              ${activeCat === cat
                ? 'bg-blush-100 text-blush-500 ring-1 ring-blush-200'
                : 'bg-cream-200/60 text-gray-500 dark:bg-dark-border dark:text-dark-muted hover:bg-cream-300'
              }`}
          >
            <span>{catEmojis[cat]}</span>
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Fix cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-cream-200 dark:bg-dark-border rounded w-2/3 mb-3" />
              <div className="h-3 bg-cream-200 dark:bg-dark-border rounded w-1/2 mb-2" />
              <div className="h-3 bg-cream-200 dark:bg-dark-border rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : displayFixes.length === 0 ? (
        <EmptyState
          emoji={activeTab === 'open' ? '🎉' : activeTab === 'claimed' ? '😴' : '📭'}
          title={
            activeTab === 'open' ? 'All clear!' :
            activeTab === 'claimed' ? 'Nobody\'s on it' :
            'Nothing closed today'
          }
          subtitle={
            activeTab === 'open' ? 'No open fixes right now. Enjoy the peace!' :
            activeTab === 'claimed' ? 'No claimed fixes at the moment.' :
            'No fixes have been closed today yet.'
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayFixes.map(fix => (
              <FixCard
                key={fix.id}
                fix={fix}
                reactions={reactions[fix.id] || []}
                onReact={handleReact}
                onRefetch={refetch}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <SmartComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={refetch}
      />
    </div>
  )
}
