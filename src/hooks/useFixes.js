import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useFixes(filter = {}) {
  const [fixes, setFixes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFixes = useCallback(async () => {
    let query = supabase
      .from('fixes')
      .select(`
        *,
        creator:created_by(id, name, avatar_id),
        claimer:claimed_by(id, name, avatar_id),
        closer:closed_by(id, name, avatar_id)
      `)
      .order('created_at', { ascending: false })

    if (filter.status) query = query.eq('status', filter.status)
    if (filter.category) query = query.eq('category', filter.category)
    if (filter.urgency) query = query.eq('urgency', filter.urgency)

    const { data, error } = await query
    if (!error) setFixes(data || [])
    setLoading(false)
  }, [filter.status, filter.category, filter.urgency])

  useEffect(() => {
    fetchFixes()
  }, [fetchFixes])

  return { fixes, loading, refetch: fetchFixes }
}

export function useReactions(fixId) {
  const [reactions, setReactions] = useState([])

  async function fetchReactions() {
    if (!fixId) return
    const { data } = await supabase
      .from('reactions')
      .select('*')
      .eq('fix_id', fixId)
    setReactions(data || [])
  }

  useEffect(() => {
    fetchReactions()
  }, [fixId])

  async function toggleReaction(userId, emoji) {
    const existing = reactions.find(r => r.user_id === userId && r.emoji === emoji)
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({ fix_id: fixId, user_id: userId, emoji })
    }
    fetchReactions()
  }

  return { reactions, toggleReaction }
}

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('weekly_fixes_closed', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return { users, loading, refetch: fetchUsers }
}