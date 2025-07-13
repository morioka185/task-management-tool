import { useState } from 'react'
import { useTaskThreads } from '../hooks/useTaskThreads'
import { useAuth } from '../contexts/AuthContext'

interface TaskThreadsProps {
  taskId: string
}

export default function TaskThreads({ taskId }: TaskThreadsProps) {
  const { threads, loading, error, createThread, deleteThread, canManageThread } = useTaskThreads(taskId)
  const { userProfile } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSubmitting(true)
    try {
      await createThread({
        task_id: taskId,
        message: newMessage.trim()
      })
      setNewMessage('')
    } catch (error) {
      console.error('メッセージ送信エラー:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (threadId: string) => {
    if (window.confirm('このメッセージを削除しますか？')) {
      try {
        await deleteThread(threadId)
      } catch (error) {
        console.error('メッセージ削除エラー:', error)
      }
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-4">
        エラー: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        コメント ({threads.length})
      </h3>
      
      {/* メッセージ一覧 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            まだコメントがありません
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-sm text-gray-900">
                      {thread.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(thread.created_at)}
                    </span>
                    {thread.user_id === userProfile?.id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        自分
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {thread.message}
                  </p>
                  {thread.attachment_url && (
                    <div className="mt-2">
                      <a
                        href={thread.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        📎 添付ファイル
                      </a>
                    </div>
                  )}
                </div>
                {canManageThread(thread) && (
                  <button
                    onClick={() => handleDelete(thread.id)}
                    className="text-red-600 hover:text-red-800 text-sm ml-2"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新規メッセージフォーム */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="コメントを入力..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newMessage.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : 'コメント'}
          </button>
        </div>
      </form>
    </div>
  )
}