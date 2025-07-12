import { useState } from 'react'
import AuthenticatedImage from './AuthenticatedImage'

interface ImageGalleryProps {
  images: string[]
}

interface ImageModalProps {
  src: string
  alt: string
  onClose: () => void
}

function ImageModal({ src, alt, onClose }: ImageModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-4xl m-4">
        <AuthenticatedImage
          src={src} 
          alt={alt}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (images.length === 0) {
    return null
  }

  return (
    <>
      <div className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => setSelectedImage(imageUrl)}
            >
              <AuthenticatedImage
                src={imageUrl}
                alt={`添付画像 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <ImageModal
          src={selectedImage}
          alt="拡大表示"
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  )
}