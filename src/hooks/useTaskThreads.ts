import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database'
import { useAuth } from '../contexts/AuthContext'

type TaskThread = Database['public']['Tables']['task_threads']['Row'] & {
  user: Database['public']['Tables']['users']['Row']
}

type TaskThreadInsert = Database['public']['Tables']['task_threads']['Insert']
type TaskThreadUpdate = Database['public']['Tables']['task_threads']['Update']

export function useTaskThreads(taskId?: string) {
  const [threads, setThreads] = useState<TaskThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userProfile } = useAuth()

  const fetchThreads = async (id?: string) => {
    if (!id) {
      setThreads([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('task_threads')
        .select(`
          *,
          user:users(*)
        `)
        .eq('task_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setThreads(data || [])
    } catch (error) {
      console.error('Thread fetch error:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const createThread = async (thread: Omit<TaskThreadInsert, 'user_id'>) => {
    if (!userProfile) {
      throw new Error('ユーザーが認証されていません')
    }

    try {
      const { data, error } = await supabase
        .from('task_threads')
        .insert({
          ...thread,
          user_id: userProfile.id
        })
        .select(`
          *,
          user:users(*)
        `)
        .single()

      if (error) throw error
      setThreads(prev => [...prev, data])
      return data
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const updateThread = async (id: string, updates: TaskThreadUpdate) => {
    try {
      const { data, error } = await supabase
        .from('task_threads')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          user:users(*)
        `)
        .single()

      if (error) throw error
      setThreads(prev => 
        prev.map(thread => 
          thread.id === id ? data : thread
        )
      )
      return data
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const deleteThread = async (id: string) => {
    try {
      const { error } = await supabase
        .from('task_threads')
        .delete()
        .eq('id', id)

      if (error) throw error
      setThreads(prev => prev.filter(thread => thread.id !== id))
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const canManageThread = (thread: TaskThread) => {
    if (!userProfile) return false
    
    if (userProfile.role === 'admin') return true
    
    return thread.user_id === userProfile.id
  }

  useEffect(() => {
    fetchThreads(taskId)
  }, [taskId])

  return {
    threads,
    loading,
    error,
    createThread,
    updateThread,
    deleteThread,
    canManageThread,
    refetch: () => fetchThreads(taskId),
  }
}