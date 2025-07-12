import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface AuthenticatedImageProps {
  src: string
  alt: string
  className?: string
  onClick?: () => void
}

export default function AuthenticatedImage({ src, alt, className, onClick }: AuthenticatedImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true)
        setError(false)

        // Supabase Storage URLかどうかをチェック
        if (src.includes('supabase') && src.includes('/storage/')) {
          // パスを抽出
          const pathMatch = src.match(/\/storage\/v1\/object\/public\/attachments\/(.+)$/)
          if (pathMatch) {
            const filePath = pathMatch[1]
            
            // 認証付きダウンロードを試行
            const { data, error } = await supabase.storage
              .from('attachments')
              .download(filePath)

            if (error) {
              console.error('Download error:', error)
              // エラーの場合は元のURLを使用
              setImageUrl(src)
            } else {
              // Blobから一時的なURLを作成
              const url = URL.createObjectURL(data)
              setImageUrl(url)
            }
          } else {
            setImageUrl(src)
          }
        } else {
          // 通常のURL
          setImageUrl(src)
        }
      } catch (error) {
        console.error('Image load error:', error)
        setError(true)
        setImageUrl(src) // フォールバック
      } finally {
        setLoading(false)
      }
    }

    if (src) {
      loadImage()
    }

    // クリーンアップ
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [src])

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">読込中...</span>
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">画像エラー</span>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={() => setError(true)}
    />
  )
}