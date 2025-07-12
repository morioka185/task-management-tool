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
        
        // 500エラー（内部サーバーエラー）の場合
        if (error.code === '500' || error.status === 500) {
          console.log('Database internal error detected, trying emergency fallback...')
          setProfileError('データベース内部エラーです。RLSポリシーまたはデータベース構造を確認してください。')
          
          // 緊急時フォールバックプロフィールを作成
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser) {
            const emergencyProfile: UserProfile = {
              id: userId,
              email: authUser.email || '',
              name: authUser.email?.split('@')[0] || 'ユーザー',
              role: 'sales',
              manager_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setUserProfile(emergencyProfile)
            console.log('Emergency profile created:', emergencyProfile)
          }
          return
        }
        
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
      console.log('Starting createUserProfile for userId:', userId)
      
      // 現在の認証ユーザー情報を取得
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting authenticated user:', userError)
        setProfileError(`認証ユーザー取得エラー: ${userError.message}`)
        return false
      }
      
      if (!authUser) {
        console.error('No authenticated user found')
        setProfileError('認証されたユーザーが見つかりません')
        return false
      }

      console.log('Authenticated user:', { id: authUser.id, email: authUser.email })

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

      const profileData = {
        id: userId,
        email: authUser.email || '',
        name: name,
        role: role,
        manager_id: null
      }

      console.log('Creating user profile with data:', profileData)

      // 最初にPostgreSQL関数を使った作成を試行
      let data, error

      try {
        console.log('Trying RPC function create_user_profile...')
        const rpcResult = await supabase.rpc('create_user_profile', {
          user_id: userId,
          user_email: authUser.email || '',
          user_name: name,
          user_role: role
        })
        
        if (rpcResult.error) {
          console.log('RPC function failed, trying direct upsert...', rpcResult.error)
          
          // RPC関数が失敗した場合は直接upsertを試行
          const upsertResult = await supabase
            .from('users')
            .upsert(profileData, { onConflict: 'id' })
            .select()
            .single()
          
          data = upsertResult.data
          error = upsertResult.error
        } else {
          console.log('RPC function succeeded')
          // RPC関数が成功した場合、作成されたユーザーを取得
          const fetchResult = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
          
          data = fetchResult.data
          error = fetchResult.error
        }
      } catch (rpcError) {
        console.log('RPC function not available, using direct upsert...', rpcError)
        
        // RPC関数が存在しない場合は直接upsertを使用
        const upsertResult = await supabase
          .from('users')
          .upsert(profileData, { onConflict: 'id' })
          .select()
          .single()
        
        data = upsertResult.data
        error = upsertResult.error
      }

      if (error) {
        console.error('Profile creation failed:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        setProfileError(`プロフィール作成エラー: ${error.message} (コード: ${error.code})`)
        return false
      }

      console.log('User profile created successfully:', data)
      setUserProfile(data)
      setProfileError(null)
      return true
    } catch (error) {
      console.error('Unexpected error in createUserProfile:', error)
      setProfileError(`予期しないエラー: ${error instanceof Error ? error.message : String(error)}`)
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
        // 作成に失敗した場合は、認証情報をベースにした最小限のプロフィールを設定
        console.log('Creating fallback profile from auth data...')
        const fallbackProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          name: user.email?.split('@')[0] || 'ユーザー',
          role: 'sales',
          manager_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        setUserProfile(fallbackProfile)
        setProfileError('データベースへの保存は失敗しましたが、一時的なプロフィールを作成しました')
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