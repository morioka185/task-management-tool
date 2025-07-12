export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'sales'
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'sales'
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'manager' | 'sales'
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          interview_id: string
          line_name: string
          real_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          interview_id: string
          line_name: string
          real_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          interview_id?: string
          line_name?: string
          real_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          customer_id: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected'
          deadline: string | null
          assigned_to: string
          assigned_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected'
          deadline?: string | null
          assigned_to: string
          assigned_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected'
          deadline?: string | null
          assigned_to?: string
          assigned_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      task_threads: {
        Row: {
          id: string
          task_id: string
          user_id: string
          message: string
          attachment_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          message: string
          attachment_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          message?: string
          attachment_url?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          type: string
          title: string
          message: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          type: string
          title: string
          message?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          type?: string
          title?: string
          message?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}