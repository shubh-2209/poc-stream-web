import axios from 'axios'

export const BACKEND_URL = 'https://jamila-coky-closer.ngrok-free.dev' 

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

const api = axios.create({ baseURL: BACKEND_URL })

export const liveStreamApi = {
  startSession: (title) =>
    api.post('/api/live-streams/start', { title }),

  uploadChunk: (sessionId, formData) =>
    api.post(`/api/live-streams/${sessionId}/chunk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  endSession: (sessionId) =>
    api.post(`/api/live-streams/${sessionId}/end`),

  cancelSession: (sessionId) =>
    api.post(`/api/live-streams/${sessionId}/cancel`).catch(() => {}),
}