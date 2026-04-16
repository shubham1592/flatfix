import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import UrgencyBadge, { CategoryTag } from './UrgencyBadge'
import toast from 'react-hot-toast'

const GEMINI_PARSE_PROMPT = `You are a task parser for a household chore app called FlatFix used by 7 roommates.
Parse the following natural language input into a structured task.
Respond with ONLY valid JSON, no markdown, no explanation.

Input: "{input}"

Return this exact JSON structure:
{
  "title": "Short, clear task title (max 8 words)",
  "description": "Brief description of what needs to be done",
  "urgency": <number 1-4, where 1=low 2=medium 3=high 4=urgent>,
  "category": "<one of: trash, dishes, bathroom, kitchen, grocery, general>",
  "location": "<one of: kitchen, bathroom, living room, bedroom, hallway, outside, general>"
}

Urgency guidelines:
- 1 (low): Nice-to-have, no time pressure
- 2 (medium): Should be done today or tomorrow
- 3 (high): Needs attention within a few hours
- 4 (urgent): Needs immediate attention`

export default function SmartComposer({ open, onClose, onCreated }) {
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [posting, setPosting] = useState(false)
  const [mode, setMode] = useState('smart') // 'smart' or 'manual'

  // Manual form state
  const [manual, setManual] = useState({
    title: '', description: '', urgency: 2, category: 'general', location: 'general'
  })

  async function parseWithAI() {
    if (!input.trim()) return
    setParsing(true)
    setParsed(null)

    try {
      // Call Supabase Edge Function that calls Gemini
      const { data, error } = await supabase.functions.invoke('parse-fix', {
        body: { text: input }
      })

      if (error) throw error
      setParsed(data)
    } catch (err) {
      console.error('AI parse failed:', err)
      toast.error('AI parsing unavailable. Try manual mode!')
      setMode('manual')
    }
    setParsing(false)
  }

  async function postFix(fixData) {
    setPosting(true)
    const { error } = await supabase.from('fixes').insert({
      ...fixData,
      created_by: user.id,
      is_ai_parsed: mode === 'smart',
    })

    if (error) {
      toast.error('Could not post fix')
    } else {
      toast.success('Fix posted! 🎉')
      resetAndClose()
      onCreated?.()
    }
    setPosting(false)
  }

  function resetAndClose() {
    setInput('')
    setParsed(null)
    setMode('smart')
    setManual({ title: '', description: '', urgency: 2, category: 'general', location: 'general' })
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end justify-center"
        onClick={resetAndClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-dark-card rounded-t-[2rem] p-6
            shadow-soft-lg max-h-[85vh] overflow-y-auto"
        >
          <div className="w-10 h-1 bg-cream-300 dark:bg-dark-border rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-dark-text">
              {mode === 'smart' ? '✨ Post a fix' : '📝 Manual fix'}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setMode('smart')}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-all
                  ${mode === 'smart' ? 'bg-blush-100 text-blush-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Smart
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-all
                  ${mode === 'manual' ? 'bg-blush-100 text-blush-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Manual
              </button>
            </div>
          </div>

          {mode === 'smart' ? (
            <>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Just describe what needs fixing... e.g. 'the kitchen trash is full again and it's starting to smell'"
                className="input min-h-[100px] resize-none mb-4"
                autoFocus
              />

              {!parsed && (
                <button
                  onClick={parseWithAI}
                  disabled={!input.trim() || parsing}
                  className="btn-primary w-full mb-4"
                >
                  {parsing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">🔮</span> Parsing...
                    </span>
                  ) : '🪄 Parse with AI'}
                </button>
              )}

              {parsed && <FixPreview fix={parsed} onConfirm={() => postFix(parsed)} onEdit={() => {
                setManual(parsed)
                setMode('manual')
              }} posting={posting} />}
            </>
          ) : (
            <ManualForm data={manual} onChange={setManual} onSubmit={() => postFix(manual)} posting={posting} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function FixPreview({ fix, onConfirm, onEdit, posting }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="card bg-cream-50 dark:bg-dark-bg">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-gray-800 dark:text-dark-text">{fix.title}</h3>
          <UrgencyBadge urgency={fix.urgency} />
        </div>
        {fix.description && (
          <p className="text-sm text-gray-500 dark:text-dark-muted mb-2">{fix.description}</p>
        )}
        <div className="flex gap-2">
          <CategoryTag category={fix.category} />
          {fix.location !== 'general' && (
            <span className="badge bg-lavender-100 text-lavender-400">📍 {fix.location}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onConfirm} disabled={posting} className="btn-primary flex-1">
          {posting ? '...' : '✅ Post this fix'}
        </button>
        <button onClick={onEdit} className="btn-ghost">
          ✏️ Edit
        </button>
      </div>
    </motion.div>
  )
}

function ManualForm({ data, onChange, onSubmit, posting }) {
  const update = (field, value) => onChange({ ...data, [field]: value })

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={data.title}
        onChange={e => update('title', e.target.value)}
        placeholder="What needs fixing?"
        className="input"
        autoFocus
      />
      <textarea
        value={data.description}
        onChange={e => update('description', e.target.value)}
        placeholder="Any details... (optional)"
        className="input min-h-[60px] resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-dark-muted mb-1 block">
            Urgency
          </label>
          <select value={data.urgency} onChange={e => update('urgency', Number(e.target.value))} className="input py-2">
            <option value={1}>🟢 Low</option>
            <option value={2}>🟡 Medium</option>
            <option value={3}>🟠 High</option>
            <option value={4}>🔴 Urgent</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-dark-muted mb-1 block">
            Category
          </label>
          <select value={data.category} onChange={e => update('category', e.target.value)} className="input py-2">
            <option value="trash">🗑️ Trash</option>
            <option value="dishes">🍽️ Dishes</option>
            <option value="bathroom">🚿 Bathroom</option>
            <option value="kitchen">🍳 Kitchen</option>
            <option value="grocery">🛒 Grocery</option>
            <option value="general">📌 General</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-dark-muted mb-1 block">
          Location
        </label>
        <select value={data.location} onChange={e => update('location', e.target.value)} className="input py-2">
          <option value="general">Anywhere</option>
          <option value="kitchen">Kitchen</option>
          <option value="bathroom">Bathroom</option>
          <option value="living room">Living room</option>
          <option value="bedroom">Bedroom</option>
          <option value="hallway">Hallway</option>
          <option value="outside">Outside</option>
        </select>
      </div>

      <button onClick={onSubmit} disabled={!data.title.trim() || posting} className="btn-primary w-full">
        {posting ? '...' : '🚀 Post fix'}
      </button>
    </div>
  )
}
