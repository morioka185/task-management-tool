import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { userProfile, user, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    role: userProfile?.role || 'sales' as const
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile || !user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // メールアドレス更新（Supabase Auth）
      if (formData.email !== userProfile.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (emailError) {
          throw new Error(`メールアドレス更新エラー: ${emailError.message}`)
        }
      }

      // プロフィール情報更新（データベース）
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)

      if (profileError) {
        throw new Error(`プロフィール更新エラー: ${profileError.message}`)
      }

      setSuccess('プロフィールが正常に更新されました')
      setIsEditing(false)
      await refreshProfile()
    } catch (error) {
      setError(error instanceof Error ? error.message : '更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || '',
      email: userProfile?.email || '',
      role: userProfile?.role || 'sales'
    })
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">プロフィール情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← 戻る
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                ユーザー情報
              </h2>
            </div>

            <div className="px-6 py-4">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    名前
                  </label>
                  <div className="mt-1">
                    {isEditing ? (
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    ) : (
                      <p className="text-sm text-gray-900 py-2">{userProfile.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <div className="mt-1">
                    {isEditing ? (
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    ) : (
                      <p className="text-sm text-gray-900 py-2">{userProfile.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    役職
                  </label>
                  <div className="mt-1">
                    {isEditing ? (
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'sales' })}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="sales">営業</option>
                        <option value="manager">マネージャー</option>
                        <option value="admin">管理者</option>
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900 py-2">
                        {userProfile.role === 'admin' ? '管理者' : 
                         userProfile.role === 'manager' ? 'マネージャー' : '営業'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ユーザーID
                  </label>
                  <p className="mt-1 text-sm text-gray-500 py-2">{userProfile.id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    作成日時
                  </label>
                  <p className="mt-1 text-sm text-gray-500 py-2">
                    {new Date(userProfile.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    最終更新日時
                  </label>
                  <p className="mt-1 text-sm text-gray-500 py-2">
                    {new Date(userProfile.updated_at).toLocaleString('ja-JP')}
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        disabled={loading}
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? '保存中...' : '保存'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                    >
                      編集
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}