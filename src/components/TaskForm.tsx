import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { useUsers } from '../hooks/useUsers'
import CustomerForm from './CustomerForm'
import ImageUpload from './ImageUpload'
import AuthenticatedImage from './AuthenticatedImage'

interface TaskFormProps {
  onClose: () => void
  onTaskCreated?: () => void
}

export default function TaskForm({ onClose, onTaskCreated }: TaskFormProps) {
  const [step, setStep] = useState<'customer' | 'task'>('customer')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [deadline, setDeadline] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { userProfile } = useAuth()
  const { createTask } = useTasks()
  const { getSalesUsers } = useUsers()

  const salesUsers = getSalesUsers()

  const handleCustomerSelected = (customer: any) => {
    setSelectedCustomer(customer)
    setStep('task')
  }

  const handleImageUploaded = (url: string) => {
    setAttachments(prev => [...prev, url])
  }

  const handleRemoveImage = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !userProfile || !title.trim() || !assignedTo) {
      return
    }

    setLoading(true)

    try {
      let finalDescription = description.trim()
      if (attachments.length > 0) {
        const imageSection = '\n\n【添付画像】\n' + attachments.map((url, index) => `${index + 1}. ${url}`).join('\n')
        finalDescription += imageSection
      }

      await createTask({
        customer_id: selectedCustomer.id,
        title: title.trim(),
        description: finalDescription || null,
        assigned_to: assignedTo,
        assigned_by: userProfile.id,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      })

      onTaskCreated?.()
      onClose()
    } catch (error) {
      console.error('タスク作成エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              新しいタスク作成
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">閉じる</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <div className={`flex items-center ${step === 'customer' ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                  step === 'customer' ? 'border-blue-600' : 'border-green-600 bg-green-600 text-white'
                }`}>
                  {step === 'customer' ? '1' : '✓'}
                </div>
                <span className="ml-2 text-sm font-medium">顧客情報</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                <div className={`h-full ${step === 'task' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className={`flex items-center ${step === 'task' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                  step === 'task' ? 'border-blue-600' : 'border-gray-300'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">タスク詳細</span>
              </div>
            </div>
          </div>

          {step === 'customer' && (
            <CustomerForm
              onCustomerSelected={handleCustomerSelected}
              onCancel={onClose}
            />
          )}

          {step === 'task' && selectedCustomer && (
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900">選択された顧客</h4>
                <p className="text-sm text-gray-600">
                  {selectedCustomer.real_name} ({selectedCustomer.line_name}) - {selectedCustomer.interview_id}
                </p>
                <button
                  onClick={() => setStep('customer')}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  顧客を変更
                </button>
              </div>

              <form onSubmit={handleTaskSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    タスク内容 *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="具体的なタスク内容を入力"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    詳細説明
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="追加の詳細情報があれば入力"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                    担当者 *
                  </label>
                  <select
                    id="assignedTo"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">担当者を選択</option>
                    {salesUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'manager' ? 'マネージャー' : '営業'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                    期限
                  </label>
                  <input
                    type="datetime-local"
                    id="deadline"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    添付画像
                  </label>
                  <ImageUpload onImageUploaded={handleImageUploaded} />
                  
                  {attachments.length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {attachments.map((url, index) => (
                          <div key={index} className="relative">
                            <AuthenticatedImage
                              src={url}
                              alt={`添付画像 ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setStep('customer')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    戻る
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'タスク作成中...' : 'タスクを作成'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}