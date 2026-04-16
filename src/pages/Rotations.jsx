import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { format, startOfWeek, endOfWeek } from 'date-fns'

const choreEmojis = {
  'Take out trash': '🗑️',
  'Load/unload dishwasher': '🍽️',
  'Clean bathroom': '🚿',
  'Refill water filter': '💧',
  'Vacuum living room': '🧹',
  'Wipe kitchen counters': '🧽',
  'Clean common areas': '🛋️',
}

export default function Rotations() {
  const { user, profile, updateProfile } = useAuth()
  const [rotation, setRotation] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyOpen, setBusyOpen] = useState(false)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  useEffect(() => {
    fetchRotation()
    fetchUsers()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('users').select('*')
    setUsers(data || [])
  }

  async function fetchRotation() {
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data: rotations } = await supabase
      .from('rotations')
      .select('*')
      .lte('week_start_date', today)
      .gte('week_end_date', today)
      .order('created_at', { ascending: false })
      .limit(1)

    if (rotations?.length > 0) {
      setRotation(rotations[0])
      const { data: assigns } = await supabase
        .from('rotation_assignments')
        .select(`
          *,
          assignee:assigned_to(id, name, avatar_id)
        `)
        .eq('rotation_id', rotations[0].id)

      setAssignments(assigns || [])
    }
    setLoading(false)
  }

  async function markComplete(assignmentId) {
    const { error } = await supabase
      .from('rotation_assignments')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', assignmentId)

    if (!error) {
      toast.success('Chore done! 💪')
      fetchRotation()
    }
  }

  async function toggleBusy(busy, reason = '') {
    await updateProfile({
      busy_status: {
        is_busy: busy,
        reason,
        start_date: busy ? new Date().toISOString() : null,
        end_date: null,
      }
    })
    toast.success(busy ? 'Marked as busy' : 'Back in action!')
    setBusyOpen(false)
  }

  const myAssignments = assignments.filter(a => a.assigned_to === user?.id)
  const otherAssignments = assignments.filter(a => a.assigned_to !== user?.id)

  return (
    <div className="page-container">
      <div className="flex items-end justify-between mb-1">
        <div>
          <h2 className="page-title">Rotations</h2>
          <p className="page-subtitle">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={() => setBusyOpen(!busyOpen)}
          className={`text-sm py-2 px-4 rounded-full font-semibold transition-all mb-5
            ${profile?.busy_status?.is_busy
              ? 'bg-orange-100 text-orange-500 ring-1 ring-orange-200'
              : 'bg-cream-200 text-gray-500 hover:bg-cream-300 dark:bg-dark-border dark:text-dark-muted'
            }`}
        >
          {profile?.busy_status?.is_busy ? '😴 Busy' : '📅 I\'m busy'}
        </button>
      </div>

      {/* Busy toggle panel */}
      {busyOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="card mb-4 overflow-hidden"
        >
          {profile?.busy_status?.is_busy ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
                You're currently marked as busy
              </p>
              <button onClick={() => toggleBusy(false)} className="btn-secondary text-sm">
                I'm back!
              </button>
            </div>
          ) : (
            <BusyForm onSubmit={(reason) => toggleBusy(true, reason)} />
          )}
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-cream-200 dark:bg-dark-border rounded w-1/2 mb-2" />
              <div className="h-4 bg-cream-200 dark:bg-dark-border rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : !rotation ? (
        <EmptyState
          emoji="📋"
          title="No rotation yet"
          subtitle="This week's chore rotation hasn't been generated yet. Check back soon!"
        />
      ) : (
        <div className="space-y-5">
          {/* My chores */}
          {myAssignments.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-blush-500 uppercase tracking-wider mb-3">
                Your chores this week
              </h3>
              <div className="space-y-2">
                {myAssignments.map((a, i) => (
                  <ChoreRow
                    key={a.id}
                    assignment={a}
                    isMine
                    index={i}
                    onComplete={() => markComplete(a.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Everyone else */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 dark:text-dark-muted uppercase tracking-wider mb-3">
              Everyone's chores
            </h3>
            <div className="space-y-2">
              {otherAssignments.map((a, i) => (
                <ChoreRow key={a.id} assignment={a} index={i} />
              ))}
            </div>
          </div>

          {rotation.generated_by === 'ai' && (
            <p className="text-center text-xs text-gray-400 dark:text-dark-muted mt-4">
              🤖 Generated by AI for maximum fairness
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ChoreRow({ assignment, isMine = false, index, onComplete }) {
  const isDone = !!assignment.completed_at
  const emoji = choreEmojis[assignment.chore] || '📌'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`card flex items-center gap-3
        ${isDone ? 'opacity-60' : ''}
        ${isMine && !isDone ? 'ring-2 ring-blush-200 dark:ring-blush-500/30' : ''}`}
    >
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-dark-text'}`}>
          {assignment.chore}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Avatar avatarId={assignment.assignee?.avatar_id} size="xs" />
          <span className="text-xs text-gray-500 dark:text-dark-muted">
            {assignment.assignee?.name?.split(' ')[0]}
          </span>
        </div>
      </div>

      {isMine && !isDone && (
        <button onClick={onComplete} className="btn-secondary text-xs py-1.5 px-3">
          Done ✓
        </button>
      )}
      {isDone && <span className="text-lg">✅</span>}
    </motion.div>
  )
}

function BusyForm({ onSubmit }) {
  const [reason, setReason] = useState('')

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700 dark:text-dark-text">
        Why are you busy?
      </p>
      <input
        type="text"
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Exams, traveling, sick..."
        className="input"
      />
      <button onClick={() => onSubmit(reason)} className="btn-primary text-sm w-full">
        Mark as busy
      </button>
    </div>
  )
}
