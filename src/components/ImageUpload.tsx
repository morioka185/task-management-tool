import React, { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  className?: string
}

export default function ImageUpload({ onImageUploaded, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルのみアップロード可能です')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以下にしてください')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `task-images/${fileName}`

      const { error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (error) {
        console.error('Storage upload error:', error)
        if (error.message.includes('not found')) {
          alert('ストレージバケットが作成されていません。管理者にお問い合わせください。')
        } else {
          alert(`アップロードエラー: ${error.message}`)
        }
        return
      }

      // パブリックURLではなく、認証付きURLを取得
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

      console.log('Uploaded file URL:', urlData.publicUrl)
      onImageUploaded(urlData.publicUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await uploadImage(file)
        }
        break
      }
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      uploadImage(imageFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  // グローバルなペーストイベントリスナーを設定
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600">アップロード中...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-sm text-gray-600">
              <p className="font-medium">クリックして画像を選択</p>
              <p>または、ドラッグ&ドロップ</p>
              <p className="text-blue-600 font-medium mt-1">Ctrl+V でスクリーンショットを貼り付け</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF (最大10MB)</p>
          </div>
        )}
      </div>
    </div>
  )
}