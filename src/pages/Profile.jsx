import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import avatars, { getTierInfo } from '../data/avatars'
import toast from 'react-hot-toast'

export default function Profile() {
  const { userId } = useParams()
  const { user, profile, updateProfile, signOut } = useAuth()
  const [viewUser, setViewUser] = useState(null)
  const [takenAvatars, setTakenAvatars] = useState([])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)

  const isOwnProfile = !userId || userId === user?.id
  const displayUser = isOwnProfile ? profile : viewUser

  useEffect(() => {
    if (userId && userId !== user?.id) {
      fetchUser(userId)
    }
    fetchTakenAvatars()
  }, [userId])

  async function fetchUser(id) {
    const { data } = await supabase.from('users').select('*').eq('id', id).single()
    setViewUser(data)
  }

  async function fetchTakenAvatars() {
    const { data } = await supabase.from('users').select('id, avatar_id').not('avatar_id', 'is', null)
    setTakenAvatars(data || [])
  }

  async function selectAvatar(avatarId) {
    const taken = takenAvatars.find(t => t.avatar_id === avatarId && t.id !== user.id)
    if (taken) {
      toast.error('This avatar is already taken!')
      return
    }

    const { error } = await updateProfile({ avatar_id: avatarId })
    if (!error) {
      toast.success('Avatar updated! ✨')
      setShowAvatarPicker(false)
      fetchTakenAvatars()
    }
  }

  if (!displayUser) {
    return (
      <div className="page-container">
        <div className="card animate-pulse">
          <div className="w-24 h-24 rounded-full bg-cream-200 mx-auto mb-4" />
          <div className="h-5 bg-cream-200 rounded w-1/3 mx-auto mb-2" />
          <div className="h-4 bg-cream-200 rounded w-1/2 mx-auto" />
        </div>
      </div>
    )
  }

  const tier = getTierInfo(displayUser.current_stars || 0)

  return (
    <div className="page-container">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card text-center mb-5 relative overflow-hidden"
      >
        {/* Decorative bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-blush-100/50 via-lavender-100/30 to-mint-100/50
          dark:from-blush-500/5 dark:via-lavender-400/5 dark:to-mint-500/5" />

        <div className="relative z-10">
          <div className="mb-3 flex justify-center">
            <div
              onClick={() => isOwnProfile && setShowAvatarPicker(!showAvatarPicker)}
              className={isOwnProfile ? 'cursor-pointer' : ''}
            >
              <Avatar
                avatarId={displayUser.avatar_id}
                size="xl"
                showRing
                isStar={displayUser.weekly_fixes_closed > 0 && displayUser.current_stars > 0}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 dark:text-dark-text mb-0.5">
            {displayUser.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-dark-muted mb-2">
            {displayUser.email}
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
            style={{ backgroundColor: tier.color + '20', color: tier.color }}>
            <span>{tier.icon}</span>
            {tier.name}
          </div>

          {isOwnProfile && !displayUser.avatar_id && (
            <p className="text-xs text-blush-400 mt-2 animate-pulse-soft">
              Tap your avatar to pick one!
            </p>
          )}
        </div>
      </motion.div>

      {/* Avatar picker */}
      {showAvatarPicker && isOwnProfile && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="card mb-5 overflow-hidden"
        >
          <h3 className="text-sm font-bold text-gray-700 dark:text-dark-text mb-3">
            Choose your avatar
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {avatars.map(a => {
              const taken = takenAvatars.some(t => t.avatar_id === a.id && t.id !== user.id)
              const selected = displayUser.avatar_id === a.id

              return (
                <button
                  key={a.id}
                  onClick={() => !taken && selectAvatar(a.id)}
                  disabled={taken}
                  className={`flex flex-col items-center gap-1 p-2 rounded-cutest transition-all duration-200
                    ${selected ? 'ring-2 ring-blush-400 bg-blush-50 dark:bg-blush-500/10 scale-105' : ''}
                    ${taken ? 'opacity-30 cursor-not-allowed' : 'hover:bg-cream-200 dark:hover:bg-dark-border active:scale-95'}`}
                >
                  <span className="text-3xl">{a.emoji}</span>
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-dark-muted">
                    {a.name}
                  </span>
                  {taken && <span className="text-[9px] text-red-400">Taken</span>}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatBox emoji="🔧" value={displayUser.total_fixes_closed} label="Total fixes" />
        <StatBox emoji="📅" value={displayUser.weekly_fixes_closed} label="This week" />
        <StatBox emoji="⭐" value={displayUser.current_stars} label="Stars earned" />
        <StatBox emoji="🔥" value={displayUser.current_streak} label="Day streak" />
      </div>

      {/* Preferences */}
      {isOwnProfile && (
        <div className="space-y-3">
          <button
            onClick={() => setShowPrefs(!showPrefs)}
            className="card w-full text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>⚙️</span>
              <span className="font-semibold text-sm text-gray-700 dark:text-dark-text">
                Chore preferences
              </span>
            </div>
            <span className="text-gray-400 text-sm">{showPrefs ? '▲' : '▼'}</span>
          </button>

          {showPrefs && <PreferencesEditor profile={displayUser} onSave={updateProfile} />}

          {/* Busy status */}
          {displayUser.busy_status?.is_busy && (
            <div className="card bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20">
              <div className="flex items-center gap-2">
                <span>😴</span>
                <div>
                  <p className="text-sm font-semibold text-orange-600">Currently busy</p>
                  {displayUser.busy_status.reason && (
                    <p className="text-xs text-orange-500/70">{displayUser.busy_status.reason}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sign out */}
          <button onClick={signOut} className="btn-ghost w-full text-sm text-red-400 hover:text-red-500 hover:bg-red-50">
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function StatBox({ emoji, value, label }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card text-center"
    >
      <span className="text-xl block mb-1">{emoji}</span>
      <p className="text-2xl font-bold text-gray-800 dark:text-dark-text">{value || 0}</p>
      <p className="text-xs text-gray-500 dark:text-dark-muted">{label}</p>
    </motion.div>
  )
}

function PreferencesEditor({ profile, onSave }) {
  const chores = ['trash', 'dishes', 'bathroom', 'kitchen', 'vacuum', 'counters', 'common areas']
  const prefs = profile.preferences || { likes: [], dislikes: [] }
  const [likes, setLikes] = useState(prefs.likes || [])
  const [dislikes, setDislikes] = useState(prefs.dislikes || [])

  function toggle(chore, list, setList, otherList, setOtherList) {
    if (list.includes(chore)) {
      setList(list.filter(c => c !== chore))
    } else {
      setList([...list, chore])
      setOtherList(otherList.filter(c => c !== chore))
    }
  }

  async function save() {
    await onSave({ preferences: { likes, dislikes } })
    toast.success('Preferences saved!')
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="card overflow-hidden"
    >
      <p className="text-xs text-gray-500 dark:text-dark-muted mb-3">
        The rotation system will try to respect your preferences.
      </p>

      <div className="space-y-3 mb-4">
        {chores.map(chore => (
          <div key={chore} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-dark-text capitalize">{chore}</span>
            <div className="flex gap-1">
              <button
                onClick={() => toggle(chore, likes, setLikes, dislikes, setDislikes)}
                className={`text-xs px-2 py-1 rounded-full transition-all
                  ${likes.includes(chore) ? 'bg-mint-200 text-mint-500' : 'bg-cream-200 text-gray-400 dark:bg-dark-border'}`}
              >
                👍
              </button>
              <button
                onClick={() => toggle(chore, dislikes, setDislikes, likes, setLikes)}
                className={`text-xs px-2 py-1 rounded-full transition-all
                  ${dislikes.includes(chore) ? 'bg-red-100 text-red-400' : 'bg-cream-200 text-gray-400 dark:bg-dark-border'}`}
              >
                👎
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} className="btn-primary text-sm w-full">Save preferences</button>
    </motion.div>
  )
}
