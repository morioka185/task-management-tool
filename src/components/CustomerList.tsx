import { useState } from 'react'
import { useCustomers } from '../hooks/useCustomers'

export default function CustomerList() {
  const { customers, loading, error } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = customers.filter(customer =>
    customer.interview_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.line_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.real_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          顧客検索
        </label>
        <input
          type="text"
          id="search"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="面談ID、LINE名、本名で検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredCustomers.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              {searchTerm ? '該当する顧客が見つかりません' : '顧客が登録されていません'}
            </li>
          ) : (
            filteredCustomers.map((customer) => (
              <li key={customer.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <span className="inline-block h-10 w-10 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center">
                          {customer.real_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {customer.real_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          LINE: {customer.line_name}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {customer.interview_id}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}