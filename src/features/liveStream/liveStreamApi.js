import axios from 'axios'

// export const BACKEND_URL = 'https://jamila-coky-closer.ngrok-free.dev'
// export const BACKEND_URL = "http://localhost:3333" 
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3333" ||"https://192.168.0.186:3333/api";

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

const api = axios.create({ baseURL: BACKEND_URL })

export const liveStreamApi = {
  startSession: (title) =>
    api.post('/live-streams/start', { title }),

  uploadChunk: (sessionId, formData) =>
    api.post(`/live-streams/${sessionId}/chunk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  endSession: (sessionId) =>
    api.post(`/live-streams/${sessionId}/end`),

  cancelSession: (sessionId) =>
    api.post(`/live-streams/${sessionId}/cancel`).catch(() => {}),
}