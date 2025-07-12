import { useState } from 'react'
import { useCustomers } from '../hooks/useCustomers'

interface CustomerFormProps {
  onCustomerSelected: (customer: any) => void
  onCancel: () => void
}

export default function CustomerForm({ onCustomerSelected, onCancel }: CustomerFormProps) {
  const [interviewId, setInterviewId] = useState('')
  const [lineName, setLineName] = useState('')
  const [realName, setRealName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateCustomers, setDuplicateCustomers] = useState<any[]>([])

  const { createCustomer, findCustomersByInterviewId } = useCustomers()

  const handleInterviewIdChange = async (value: string) => {
    setInterviewId(value)
    
    if (value.trim()) {
      try {
        const existing = await findCustomersByInterviewId(value.trim())
        
        if (existing.length > 0) {
          const exactMatch = existing.find(
            customer => customer.line_name === lineName && customer.real_name === realName
          )
          
          if (exactMatch) {
            setLineName(exactMatch.line_name)
            setRealName(exactMatch.real_name)
          } else if (existing.length === 1 && !lineName && !realName) {
            setLineName(existing[0].line_name)
            setRealName(existing[0].real_name)
          }
        }
      } catch (error) {
        console.error('面談ID検索エラー:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!interviewId.trim() || !lineName.trim() || !realName.trim()) {
      return
    }

    setLoading(true)

    try {
      const existing = await findCustomersByInterviewId(interviewId.trim())
      
      const exactMatch = existing.find(
        customer => 
          customer.interview_id === interviewId.trim() &&
          customer.line_name === lineName.trim() && 
          customer.real_name === realName.trim()
      )

      if (exactMatch) {
        onCustomerSelected(exactMatch)
        return
      }

      const duplicates = existing.filter(
        customer => 
          customer.line_name !== lineName.trim() || 
          customer.real_name !== realName.trim()
      )

      if (duplicates.length > 0) {
        setDuplicateCustomers(duplicates)
        setShowDuplicateDialog(true)
        setLoading(false)
        return
      }

      const newCustomer = await createCustomer({
        interview_id: interviewId.trim(),
        line_name: lineName.trim(),
        real_name: realName.trim(),
      })

      onCustomerSelected(newCustomer)
    } catch (error) {
      console.error('顧客作成エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmCreate = async () => {
    try {
      const newCustomer = await createCustomer({
        interview_id: interviewId.trim(),
        line_name: lineName.trim(),
        real_name: realName.trim(),
      })
      onCustomerSelected(newCustomer)
    } catch (error) {
      console.error('顧客作成エラー:', error)
    } finally {
      setShowDuplicateDialog(false)
    }
  }

  if (showDuplicateDialog) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              面談ID重複確認
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              面談ID「{interviewId}」は既に存在します。
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <strong>既存:</strong>
                {duplicateCustomers.map((customer) => (
                  <div key={customer.id} className="ml-2">
                    {customer.real_name} ({customer.line_name})
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <strong>新規:</strong>
                <div className="ml-2">
                  {realName} ({lineName})
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              このまま作成しますか？
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDuplicateDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                作成する
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="interviewId" className="block text-sm font-medium text-gray-700">
          面談ID
        </label>
        <input
          type="text"
          id="interviewId"
          required
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="面談IDを入力"
          value={interviewId}
          onChange={(e) => handleInterviewIdChange(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="lineName" className="block text-sm font-medium text-gray-700">
          LINE名
        </label>
        <input
          type="text"
          id="lineName"
          required
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="LINE表示名を入力"
          value={lineName}
          onChange={(e) => setLineName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="realName" className="block text-sm font-medium text-gray-700">
          本名
        </label>
        <input
          type="text"
          id="realName"
          required
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="実名を入力"
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '処理中...' : '次へ'}
        </button>
      </div>
    </form>
  )
}