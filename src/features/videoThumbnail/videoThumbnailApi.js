const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'
 
export function uploadVideoForThumbnails(file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('video', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const json = JSON.parse(xhr.responseText)
        resolve(json.data)
      } else {
        try {
          const json = JSON.parse(xhr.responseText)
          reject(new Error(json.message || 'Thumbnail upload failed'))
        } catch {
          reject(new Error('Thumbnail upload failed'))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.open('POST', `${BASE_URL}/thumbnails/upload`)
    xhr.send(form)
  })
}

// Get thumbnails for a video by ID
export async function getThumbnailsApi(videoId) {
  const res = await fetch(`${BASE_URL}/thumbnails/videos/${videoId}/thumbnails`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to fetch thumbnails')
  return json.data
}

// Full image URL helper (thumbnails are served from backend)
export function getThumbnailImageUrl(imagePath) {
  return `${BASE_URL}${imagePath}`
}