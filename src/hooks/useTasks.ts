import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database'
import { useAuth } from '../contexts/AuthContext'
import { notifyTaskAssigned, notifyTaskCompleted, notifyTaskApproved, notifyTaskRejected } from '../lib/notifications'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row']
  assigned_to_user: Database['public']['Tables']['users']['Row']
  assigned_by_user: Database['public']['Tables']['users']['Row']
}

type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { userProfile } = useAuth()

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching tasks...')
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          customer:customers(*),
          assigned_to_user:users!tasks_assigned_to_fkey(*),
          assigned_by_user:users!tasks_assigned_by_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Tasks fetch error:', error)
        throw error
      }
      console.log('Tasks fetched:', data?.length || 0, 'tasks')
      setTasks(data || [])
    } catch (error) {
      console.error('Full error:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (task: TaskInsert) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select(`
          *,
          customer:customers(*),
          assigned_to_user:users!tasks_assigned_to_fkey(*),
          assigned_by_user:users!tasks_assigned_by_fkey(*)
        `)
        .single()

      if (error) throw error
      setTasks(prev => [data, ...prev])

      await notifyTaskAssigned(
        data.id,
        data.assigned_to,
        data.title,
        data.assigned_by_user.name
      )

      return data
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const updateTask = async (id: string, updates: TaskUpdate) => {
    try {
      const originalTask = tasks.find(t => t.id === id)
      
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          customer:customers(*),
          assigned_to_user:users!tasks_assigned_to_fkey(*),
          assigned_by_user:users!tasks_assigned_by_fkey(*)
        `)
        .single()

      if (error) throw error
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? data : task
        )
      )

      if (originalTask && updates.status && originalTask.status !== updates.status) {
        switch (updates.status) {
          case 'completed':
            await notifyTaskCompleted(
              data.id,
              data.assigned_by,
              data.title,
              data.assigned_to_user.name
            )
            break
          case 'approved':
            await notifyTaskApproved(
              data.id,
              data.assigned_to,
              data.title
            )
            break
          case 'rejected':
            await notifyTaskRejected(
              data.id,
              data.assigned_to,
              data.title
            )
            break
        }
      }

      return data
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  const getMyTasks = () => {
    if (!userProfile) return []
    return tasks.filter(task => task.assigned_to === userProfile.id)
  }

  const getTasksAssignedByMe = () => {
    if (!userProfile) return []
    return tasks.filter(task => task.assigned_by === userProfile.id)
  }

  const canManageTask = (task: Task) => {
    if (!userProfile) return false
    
    if (userProfile.role === 'admin') return true
    
    if (userProfile.role === 'manager') {
      return task.assigned_by === userProfile.id || 
             task.assigned_to === userProfile.id
    }
    
    return task.assigned_to === userProfile.id
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    getMyTasks,
    getTasksAssignedByMe,
    canManageTask,
    refetch: fetchTasks,
  }
}