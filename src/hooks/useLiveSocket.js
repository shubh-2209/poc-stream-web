import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { BACKEND_URL } from '../features/liveStream/liveStreamApi'

export function useLiveSocket() {
  const [socket, setSocket] = useState(null)
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      extraHeaders: {
    'ngrok-skip-browser-warning': 'true',  
  },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    })

    s.on('connect',    () => console.log('[Socket] connected:', s.id))
    s.on('disconnect', () => console.log('[Socket] disconnected'))

    setSocket(s)
    return () => s.disconnect()
  }, [])

  return socket
}