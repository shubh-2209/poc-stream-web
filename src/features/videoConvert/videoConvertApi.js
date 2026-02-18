// src/features/videoConvert/videoConvertApi.js

import { api } from '../../api/apiHelper'

const BASE_URL = '/videos'

// ─── Upload Video with Progress ───────────────────────────────────────────────

export function uploadVideo(file, title, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('video', file)
    if (title) formData.append('title', title)

    const xhr = new XMLHttpRequest()

    // Get token from Redux store for Authorization header
    const getAuthToken = () => {
      try {
        const state = JSON.parse(localStorage.getItem('persist:root') || '{}')
        const auth = JSON.parse(state.auth || '{}')
        return auth.token || null
      } catch {
        return null
      }
    }

    // Progress tracking
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentage = Math.round((e.loaded / e.total) * 100)
        onProgress(percentage)
      }
    })

    // Success handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response.data)
        } catch (error) {
          reject(new Error('Failed to parse response'))
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText)
          reject(new Error(response.error || response.message || 'Upload failed'))
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      }
    })

    // Error handlers
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'))
    })

    // Open request with full URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
    xhr.open('POST', `${baseUrl}${BASE_URL}/upload-video-convert`)

    // Add Authorization header if token exists
    const token = getAuthToken()
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.withCredentials = true
    xhr.send(formData)
  })
}

// ─── Convert Video ────────────────────────────────────────────────────────────

/**
 * Convert video with advanced filters
 * @param {Object} options
 * @param {number} options.videoId - ID of uploaded video
 * @param {string} options.outputFormat - Output format (mp4, mkv, webm, etc.)
 * @param {string} options.quality - Quality preset (lossless, high, medium, low)
 * @param {string} [options.resolution] - Target resolution (360p, 480p, 720p, etc.)
 * @param {Object} [options.filters] - Advanced filters object
 */
export async function convertVideo(options) {
  try {
    const response = await api.post(`${BASE_URL}/convert`, options)
    return response.data
  } catch (error) {
    const message = error?.response?.data?.error || 
                    error?.response?.data?.message || 
                    error?.message || 
                    'Conversion failed'
    throw new Error(message)
  }
}

// ─── Download Video ───────────────────────────────────────────────────────────

/**
 * Download converted video
 * @param {number} videoId - ID of converted video
 */
export async function downloadVideo(videoId) {
  try {
    // Get the full axios instance to access blob response
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
    const token = getAuthToken()
    
    const response = await fetch(`${baseUrl}${BASE_URL}/${videoId}/download`, {
      method: 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || data.message || 'Download failed')
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = `video_${videoId}.mp4`

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }

    // Create blob and trigger download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    const message = error?.message || 'Network error during download'
    throw new Error(message)
  }
}

// ─── Helper to get auth token ─────────────────────────────────────────────────

function getAuthToken() {
  try {
    const state = JSON.parse(localStorage.getItem('persist:root') || '{}')
    const auth = JSON.parse(state.auth || '{}')
    return auth.token || null
  } catch {
    return null
  }
}

// ─── Get Download URL (alternative method) ────────────────────────────────────

export function getDownloadUrl(videoId) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
  return `${baseUrl}${BASE_URL}/${videoId}/download`
}