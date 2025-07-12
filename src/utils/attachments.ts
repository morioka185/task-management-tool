export function extractImagesFromDescription(description: string | null): {
  cleanDescription: string
  imageUrls: string[]
} {
  if (!description) {
    return { cleanDescription: '', imageUrls: [] }
  }

  // 【添付画像】セクションを探す
  const imageSection = description.match(/\n\n【添付画像】\n([\s\S]*?)$/m)
  
  if (!imageSection) {
    return { cleanDescription: description, imageUrls: [] }
  }

  // 画像URLを抽出
  const imageUrls = imageSection[1]
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(url => url.startsWith('http'))

  // 画像セクションを除いたテキスト
  const cleanDescription = description.replace(/\n\n【添付画像】\n[\s\S]*$/, '')

  return { cleanDescription, imageUrls }
}

export function formatDescriptionWithImages(description: string, imageUrls: string[]): string {
  let result = description.trim()
  
  if (imageUrls.length > 0) {
    const imageSection = '\n\n【添付画像】\n' + imageUrls.map((url, index) => `${index + 1}. ${url}`).join('\n')
    result += imageSection
  }
  
  return result
}