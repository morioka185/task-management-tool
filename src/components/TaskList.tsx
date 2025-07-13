import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../contexts/AuthContext'
import { extractImagesFromDescription } from '../utils/attachments'
import ImageGallery from './ImageGallery'
import TaskModal from './TaskModal'

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

interface TaskListProps {
  filter?: 'all' | 'my' | 'assigned_by_me'
  onTaskClick?: (task: any) => void
}

export default function TaskList({ filter = 'all', onTaskClick }: TaskListProps) {
  const { tasks, loading, error, updateTask, revertTaskStatus, canRevertTaskStatus } = useTasks()
  const { userProfile } = useAuth()
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getFilteredTasks = () => {
    if (!userProfile) return []
    
    switch (filter) {
      case 'my':
        return tasks.filter(task => task.assigned_to === userProfile.id)
      case 'assigned_by_me':
        return tasks.filter(task => task.assigned_by === userProfile.id)
      default:
        return tasks
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId)
    try {
      await updateTask(taskId, { status: newStatus as any })
    } catch (error) {
      console.error('ステータス更新エラー:', error)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleRevertStatus = async (taskId: string) => {
    setUpdatingTaskId(taskId)
    try {
      await revertTaskStatus(taskId)
    } catch (error) {
      console.error('ステータス復元エラー:', error)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleTaskClick = (task: any) => {
    if (onTaskClick) {
      onTaskClick(task)
    } else {
      setSelectedTask(task)
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const getAvailableStatuses = (currentStatus: string, task: any) => {
    if (!userProfile) return []

    const isAssignee = task.assigned_to === userProfile.id
    const isAssigner = task.assigned_by === userProfile.id
    const isAdmin = userProfile.role === 'admin'

    const statuses = []

    if (isAssignee) {
      if (currentStatus === 'pending') {
        statuses.push('in_progress')
      }
      if (currentStatus === 'in_progress') {
        statuses.push('completed')
      }
      if (currentStatus === 'rejected') {
        statuses.push('in_progress')
      }
    }

    if (isAssigner || isAdmin) {
      if (currentStatus === 'completed') {
        statuses.push('approved', 'rejected')
      }
    }

    return statuses
  }

  const filteredTasks = getFilteredTasks()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        エラー: {error}
      </div>
    )
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        タスクがありません
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {filteredTasks.map((task) => {
          const { cleanDescription, imageUrls } = extractImagesFromDescription(task.description)
          
          return (
            <li key={task.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
                    {task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        期限超過
                      </span>
                    )}
                    {imageUrls.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        📎 {imageUrls.length}件
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {task.title}
                    </h3>
                    {cleanDescription && (
                      <p className="text-sm text-gray-600 mt-1 overflow-hidden" style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {cleanDescription}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      顧客: {task.customer.real_name} ({task.customer.interview_id})
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>担当: {task.assigned_to_user.name}</span>
                      <span>作成者: {task.assigned_by_user.name}</span>
                      {task.deadline && (
                        <span>期限: {new Date(task.deadline).toLocaleDateString('ja-JP')}</span>
                      )}
                    </div>
                    
                    {imageUrls.length > 0 && (
                      <ImageGallery images={imageUrls} />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                {getAvailableStatuses(task.status, task).length > 0 && (
                  <select
                    value={task.status}
                    onChange={(e) => {
                      e.stopPropagation()
                      handleStatusChange(task.id, e.target.value)
                    }}
                    disabled={updatingTaskId === task.id}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={task.status}>
                      {statusLabels[task.status]}
                    </option>
                    {getAvailableStatuses(task.status, task).map(status => (
                      <option key={status} value={status}>
                        {statusLabels[status as keyof typeof statusLabels]}
                      </option>
                    ))}
                  </select>
                )}

                {canRevertTaskStatus(task.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRevertStatus(task.id)
                    }}
                    disabled={updatingTaskId === task.id}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    元に戻す
                  </button>
                )}
              </div>
            </div>
          </li>
          )
        })}
      </ul>
      
      {/* タスクモーダル */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  )
}