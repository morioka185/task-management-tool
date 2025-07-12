import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database'

type User = Database['public']['Tables']['users']['Row']

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getSalesUsers = () => {
    return users.filter(user => user.role === 'sales' || user.role === 'manager')
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    getSalesUsers,
    refetch: fetchUsers,
  }
}