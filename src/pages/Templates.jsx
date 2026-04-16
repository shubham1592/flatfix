import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import UrgencyBadge, { CategoryTag } from '../components/UrgencyBadge'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

export default function Templates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', urgency: 2, category: 'general'
  })

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    const { data } = await supabase
      .from('templates')
      .select('*, creator:created_by(name, avatar_id)')
      .order('created_at', { ascending: false })
    setTemplates(data || [])
    setLoading(false)
  }

  async function createTemplate() {
    if (!form.title.trim()) return
    const { error } = await supabase.from('templates').insert({
      ...form,
      created_by: user.id,
    })
    if (!error) {
      toast.success('Template saved!')
      setForm({ title: '', description: '', urgency: 2, category: 'general' })
      setShowForm(false)
      fetchTemplates()
    }
  }

  async function repostFromTemplate(template) {
    const { error } = await supabase.from('fixes').insert({
      title: template.title,
      description: template.description,
      urgency: template.urgency,
      category: template.category,
      created_by: user.id,
      is_from_template: true,
    })
    if (!error) toast.success('Fix posted from template! 🎉')
    else toast.error('Could not post fix')
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return
    await supabase.from('templates').delete().eq('id', id)
    toast.success('Template deleted')
    fetchTemplates()
  }

  return (
    <div className="page-container">
      <div className="flex items-end justify-between mb-1">
        <div>
          <h2 className="page-title">Templates</h2>
          <p className="page-subtitle">Quick-post recurring fixes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm py-2 px-4 mb-5"
        >
          {showForm ? '✕ Cancel' : '+ New'}
        </button>
      </div>

      {/* Create template form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="card mb-5 overflow-hidden"
          >
            <h3 className="text-sm font-bold text-gray-700 dark:text-dark-text mb-3">
              New template
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Template title"
                className="input"
                autoFocus
              />
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Description (optional)"
                className="input min-h-[60px] resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.urgency}
                  onChange={e => setForm({ ...form, urgency: Number(e.target.value) })}
                  className="input py-2"
                >
                  <option value={1}>🟢 Low</option>
                  <option value={2}>🟡 Medium</option>
                  <option value={3}>🟠 High</option>
                  <option value={4}>🔴 Urgent</option>
                </select>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="input py-2"
                >
                  <option value="trash">🗑️ Trash</option>
                  <option value="dishes">🍽️ Dishes</option>
                  <option value="bathroom">🚿 Bathroom</option>
                  <option value="kitchen">🍳 Kitchen</option>
                  <option value="grocery">🛒 Grocery</option>
                  <option value="general">📌 General</option>
                </select>
              </div>
              <button
                onClick={createTemplate}
                disabled={!form.title.trim()}
                className="btn-primary w-full text-sm"
              >
                Save template
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="card animate-pulse h-28" />)}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="No templates yet"
          subtitle="Save commonly posted fixes as templates for one-tap reposting."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="card flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-sm text-gray-800 dark:text-dark-text flex-1 truncate pr-1">
                  {t.title}
                </h3>
                {t.created_by === user?.id && (
                  <button onClick={() => deleteTemplate(t.id)} className="text-xs text-gray-400 hover:text-red-400 shrink-0">
                    ✕
                  </button>
                )}
              </div>

              {t.description && (
                <p className="text-xs text-gray-500 dark:text-dark-muted line-clamp-2 mb-2">
                  {t.description}
                </p>
              )}

              <div className="flex gap-1 mb-3 flex-wrap">
                <UrgencyBadge urgency={t.urgency} />
                <CategoryTag category={t.category} />
              </div>

              <button
                onClick={() => repostFromTemplate(t)}
                className="mt-auto btn-secondary text-xs py-2 w-full"
              >
                🚀 Post fix
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
