import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { user, signIn, signUp } = useAuth()

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // テスト用固定ログイン
      if (!isSignUp && (
        (email === 'admin' && password === 'admin') ||
        (email === 'manager' && password === 'manager') ||
        (email === 'sales' && password === 'sales')
      )) {
        try {
          // 実際のSupabaseアカウントでログインを試行
          await signIn(`${email}@test.com`, 'password123')
        } catch (error) {
          // Supabaseアカウントが存在しない場合のエラーハンドリング
          console.log('Supabaseアカウントが存在しません。テストデータを作成してください。')
          setError('テストアカウントが作成されていません。管理者にお問い合わせください。')
        }
        return
      }

      if (isSignUp) {
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </h2>
          {!isSignUp && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">テスト用ログイン</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setEmail('admin'); setPassword('admin'); }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
                >
                  管理者
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('manager'); setPassword('manager'); }}
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                >
                  マネージャー
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('sales'); setPassword('sales'); }}
                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-2 py-1 rounded"
                >
                  営業
                </button>
              </div>
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="rounded-md shadow-sm -space-y-px">
            {isSignUp && (
              <div>
                <input
                  type="text"
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="氏名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <input
                type={!isSignUp && (email === 'admin' || email === 'manager' || email === 'sales') ? 'text' : 'email'}
                required
                className={`relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
                  isSignUp ? '' : 'rounded-t-md'
                } focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder={!isSignUp ? "メールアドレス または テストID (admin/manager/sales)" : "メールアドレス"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
            >
              {isSignUp ? 'ログインはこちら' : 'アカウント作成はこちら'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}