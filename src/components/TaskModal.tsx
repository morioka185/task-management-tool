import { useState } from 'react'
import { Database } from '../types/database'
import { extractImagesFromDescription } from '../utils/attachments'
import ImageGallery from './ImageGallery'
import TaskThreads from './TaskThreads'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row']
  assigned_to_user: Database['public']['Tables']['users']['Row']
  assigned_by_user: Database['public']['Tables']['users']['Row']
}

interface TaskModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
}

const statusLabels = {
  pending: '未着手',
  in_progress: '作業中',
  completed: '完了（承認待ち）',
  approved: '承認済み',
  rejected: '差し戻し',
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'threads'>('details')
  
  if (!isOpen) return null

  const { cleanDescription, imageUrls } = extractImagesFromDescription(task.description || '')

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {task.title}
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
              {statusLabels[task.status]}
            </span>
            {task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                期限超過
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'details'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              詳細
            </button>
            <button
              onClick={() => setActiveTab('threads')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'threads'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              コメント
            </button>
          </nav>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' ? (
            <div className="space-y-4">
              {/* 基本情報 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">顧客情報</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {task.customer.real_name} ({task.customer.interview_id})
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">担当者</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {task.assigned_to_user.name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">作成者</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {task.assigned_by_user.name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">期限</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('ja-JP') : '未設定'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">作成日時</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDateTime(task.created_at)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">更新日時</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDateTime(task.updated_at)}
                  </p>
                </div>
              </div>

              {/* 説明 */}
              {cleanDescription && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">説明</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                    {cleanDescription}
                  </p>
                </div>
              )}

              {/* 添付画像 */}
              {imageUrls.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    添付画像 ({imageUrls.length}件)
                  </h3>
                  <ImageGallery images={imageUrls} />
                </div>
              )}
            </div>
          ) : (
            <TaskThreads taskId={task.id} />
          )}
        </div>
      </div>
    </div>
  )
}