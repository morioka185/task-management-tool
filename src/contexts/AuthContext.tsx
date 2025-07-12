import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  profileError: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  createProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      setProfileError(null)
      console.log('Fetching user profile for:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        
        // ユーザーが見つからない場合は自動作成を試行
        if (error.code === 'PGRST116') {
          console.log('User not found in database, attempting to create...')
          const success = await createUserProfile(userId)
          if (success) {
            return // 作成成功時は再帰呼び出しで再取得
          }
        }
        
        setProfileError('ユーザープロフィールの取得に失敗しました')
        throw error
      }
      console.log('User profile fetched:', data)
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfileError('ユーザー情報が見つかりません。管理者にお問い合わせください。')
    }
  }

  const createUserProfile = async (userId: string): Promise<boolean> => {
    try {
      // 現在の認証ユーザー情報を取得
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        console.error('No authenticated user found')
        return false
      }

      // メールアドレスから役職を推定
      let role: 'admin' | 'manager' | 'sales' = 'sales'
      let name = authUser.email?.split('@')[0] || 'ユーザー'
      
      if (authUser.email?.includes('admin')) {
        role = 'admin'
        name = '管理者'
      } else if (authUser.email?.includes('manager')) {
        role = 'manager'
        name = 'マネージャー'
      } else if (authUser.email?.includes('sales')) {
        role = 'sales'
        name = '営業担当'
      }

      // ユーザープロフィールを作成
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.email || '',
          name: name,
          role: role,
          manager_id: null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        return false
      }

      console.log('User profile created successfully:', data)
      setUserProfile(data)
      setProfileError(null)
      return true
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      return false
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const createProfile = async () => {
    if (user) {
      const success = await createUserProfile(user.id)
      if (!success) {
        setProfileError('プロフィールの作成に失敗しました')
      }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    profileError,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    createProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}