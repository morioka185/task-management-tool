import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import TaskForm from '../components/TaskForm'
import TaskList from '../components/TaskList'
import CustomerList from '../components/CustomerList'
import NotificationCenter from '../components/NotificationCenter'

export default function Dashboard() {
  const { user, userProfile, profileError, signOut, refreshProfile, createProfile } = useAuth()
  const { getMyTasks, getTasksAssignedByMe, getTasksByStatus } = useTasks()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'customers'>('dashboard')
  const [showTaskForm, setShowTaskForm] = useState(false)

  const myTasks = getMyTasks()
  const tasksAssignedByMe = getTasksAssignedByMe()
  const pendingApprovals = getTasksByStatus('completed')

  const canCreateTasks = userProfile?.role === 'admin' || userProfile?.role === 'manager'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              タスク管理ツール
            </h1>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              {profileError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2">
                  <p className="text-xs text-red-700 mb-1">プロフィール読み込みエラー:</p>
                  <p className="text-xs text-red-600">{profileError}</p>
                </div>
              )}
              <div className="flex items-center space-x-2">
                {profileError ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-red-600">
                      {user?.email || 'ユーザー'} (プロフィール読み込みエラー)
                    </span>
                    <button
                      onClick={refreshProfile}
                      className="text-xs text-red-600 hover:text-red-800 border border-red-300 px-2 py-1 rounded"
                      title={profileError}
                    >
                      再試行
                    </button>
                    <button
                      onClick={createProfile}
                      className="text-xs text-green-600 hover:text-green-800 border border-green-300 px-2 py-1 rounded"
                      title="プロフィールを新規作成します"
                    >
                      作成
                    </button>
                  </div>
                ) : userProfile ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      {userProfile.name} ({userProfile.role === 'admin' ? '管理者' : userProfile.role === 'manager' ? 'マネージャー' : '営業'})
                    </span>
                    <button
                      onClick={refreshProfile}
                      className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 px-2 py-1 rounded"
                      title="プロフィール更新"
                    >
                      更新
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {user?.email || 'ユーザー'} (読み込み中...)
                    </span>
                    <button
                      onClick={refreshProfile}
                      className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 px-2 py-1 rounded"
                      title="プロフィール更新"
                    >
                      更新
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ダッシュボード
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              タスク管理
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              顧客管理
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
                {canCreateTasks && (
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    新しいタスクを作成
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{myTasks.length}</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            自分のタスク
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {myTasks.filter(t => t.status !== 'approved').length} / {myTasks.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {canCreateTasks && (
                  <>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                              <span className="text-white text-sm font-bold">{tasksAssignedByMe.length}</span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                割り当てたタスク
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {tasksAssignedByMe.filter(t => t.status !== 'approved').length} / {tasksAssignedByMe.length}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                              <span className="text-white text-sm font-bold">{pendingApprovals.length}</span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                承認待ち
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                確認が必要
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">自分のタスク</h3>
                  <TaskList filter="my" />
                </div>

                {canCreateTasks && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">割り当てたタスク</h3>
                    <TaskList filter="assigned_by_me" />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">タスク管理</h2>
                {canCreateTasks && (
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    新しいタスクを作成
                  </button>
                )}
              </div>
              <TaskList filter="all" />
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">顧客管理</h2>
              <CustomerList />
            </div>
          )}
        </div>
      </main>

      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={() => {
            setShowTaskForm(false)
          }}
        />
      )}
    </div>
  )
}