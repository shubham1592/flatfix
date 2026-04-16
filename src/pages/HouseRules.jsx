import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

export default function HouseRules() {
  const { user } = useAuth()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [newRule, setNewRule] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    fetchRules()
  }, [])

  async function fetchRules() {
    const { data } = await supabase
      .from('house_rules')
      .select('*, author:added_by(name)')
      .order('display_order')
    setRules(data || [])
    setLoading(false)
  }

  async function addRule() {
    if (!newRule.trim()) return
    const maxOrder = rules.length > 0 ? Math.max(...rules.map(r => r.display_order)) : 0

    const { error } = await supabase.from('house_rules').insert({
      text: newRule.trim(),
      display_order: maxOrder + 1,
      added_by: user.id,
    })

    if (!error) {
      setNewRule('')
      toast.success('Rule added!')
    }
  }

  async function updateRule(id) {
    if (!editText.trim()) return
    await supabase.from('house_rules')
      .update({ text: editText.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
    setEditingId(null)
    toast.success('Rule updated')
  }

  async function deleteRule(id) {
    if (!confirm('Remove this rule?')) return
    await supabase.from('house_rules').delete().eq('id', id)
    toast.success('Rule removed')
  }

  async function moveRule(id, direction) {
    const idx = rules.findIndex(r => r.id === id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= rules.length) return

    const updates = [
      { id: rules[idx].id, display_order: rules[swapIdx].display_order },
      { id: rules[swapIdx].id, display_order: rules[idx].display_order },
    ]

    for (const u of updates) {
      await supabase.from('house_rules').update({ display_order: u.display_order }).eq('id', u.id)
    }
  }

  return (
    <div className="page-container">
      <h2 className="page-title">House rules</h2>
      <p className="page-subtitle">Our shared agreement for apartment life</p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-14" />)}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          emoji="📜"
          title="No rules yet"
          subtitle="Add your first house rule below. Everyone can see and edit these."
        />
      ) : (
        <div className="space-y-2 mb-6">
          <AnimatePresence mode="popLayout">
            {rules.map((rule, i) => (
              <motion.div
                key={rule.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="card flex items-start gap-3"
              >
                <span className="text-sm font-bold text-blush-300 mt-0.5 w-6 shrink-0">
                  {i + 1}.
                </span>

                {editingId === rule.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && updateRule(rule.id)}
                      className="input py-1.5 text-sm flex-1"
                      autoFocus
                    />
                    <button onClick={() => updateRule(rule.id)} className="text-mint-500 text-sm font-semibold">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-dark-text">{rule.text}</p>
                      <p className="text-[10px] text-gray-400 dark:text-dark-muted mt-0.5">
                        Added by {rule.author?.name?.split(' ')[0]}
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => moveRule(rule.id, 'up')}
                        disabled={i === 0}
                        className="p-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >▲</button>
                      <button
                        onClick={() => moveRule(rule.id, 'down')}
                        disabled={i === rules.length - 1}
                        className="p-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >▼</button>
                      <button
                        onClick={() => { setEditingId(rule.id); setEditText(rule.text) }}
                        className="p-1 text-xs text-gray-400 hover:text-blue-500"
                      >✏️</button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1 text-xs text-gray-400 hover:text-red-400"
                      >🗑️</button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add new rule */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newRule}
          onChange={e => setNewRule(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addRule()}
          placeholder="Add a new house rule..."
          className="input flex-1"
        />
        <button onClick={addRule} disabled={!newRule.trim()} className="btn-primary text-sm px-4">
          Add
        </button>
      </div>
    </div>
  )
}