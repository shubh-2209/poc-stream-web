const BASE_URL = 'https://jamila-coky-closer.ngrok-free.dev/api'
 
// Upload with progress tracking
export function uploadVideo(file, onProgress) {
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
          reject(new Error(json.error || 'Upload failed'))
        } catch {
          reject(new Error('Upload failed'))
        }
      }
    })
 
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.open('POST', `${BASE_URL}/videos/upload`)
    xhr.send(form)
  })
}
 
// Convert with advanced filters
// opts = {
//   fileName, outputFormat, quality, resolution,
//   filters: { brightness, contrast, saturation, gamma, sharpen, denoise, blur, vignette,
//              rotate, flipH, flipV, blackWhite, sepia, negative, colorTemp, vibrance }
// }
export async function convertVideo(opts) {
  const res = await fetch(`${BASE_URL}/videos/convert`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(opts),
  })
 
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Conversion failed')
  return json.data
}
 
// Get download URL
export function getDownloadUrl(fileName, source = 'converted') {
  return `${BASE_URL}/videos/download/${fileName}?source=${source}`
}