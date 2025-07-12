import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database'

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching customers...')
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Customers fetch error:', error)
        throw error
      }
      console.log('Customers fetched:', data?.length || 0, 'customers')
      setCustomers(data || [])
    } catch (error) {
      console.error('Full error:', error)
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const createCustomer = async (customer: CustomerInsert) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single()

      if (error) throw error
      setCustomers(prev => [data, ...prev])
      return data
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const findCustomersByInterviewId = async (interviewId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('interview_id', interviewId)

      if (error) throw error
      return data || []
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? data : customer
        )
      )
      return data
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return {
    customers,
    loading,
    error,
    createCustomer,
    findCustomersByInterviewId,
    updateCustomer,
    refetch: fetchCustomers,
  }
}