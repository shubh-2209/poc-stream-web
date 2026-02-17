'use client'
import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'

// Backend URL
axios.defaults.baseURL = 'http://localhost:3333'

type UserMode = 'home' | 'broadcaster' | 'viewer'

export default function LiveStream() {
  const [userMode, setUserMode] = useState<UserMode>('home')

  // Broadcaster states
  const [title, setTitle] = useState('My Live Stream')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState('')
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null)
  const [viewersCount, setViewersCount] = useState(0) // Renamed for clarity

  // Viewer states
  const [availableStreams, setAvailableStreams] = useState<any[]>([])
  const [watchingStreamId, setWatchingStreamId] = useState<string | null>(null)
  const [liveTitle, setLiveTitle] = useState('')
  const [liveViewers, setLiveViewers] = useState(0)

  // Socket ref
  const socketRef = useRef<Socket | null>(null)

  // Refs for video
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
// https://192.168.0.186:3334
  // Socket connection
  useEffect(() => {
    const socket = io('http://localhost:3333', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      setStatus('Socket connected')

      if (userMode === 'broadcaster') {
        socket.emit('start-broadcasting')
      }

      if (userMode === 'viewer') {
        getAvailableStreams(socket)
      }
    })

    // Receive video chunks for viewers
    socket.on('video-chunk', (data) => {
      if (data?.chunk) {
        handleVideoChunk(data.chunk)
      }
    })

    // Viewer count - expect number only (fixed type + safety)
    socket.on('viewer-count', (data: number | { count: number }) => {
      const count = typeof data === 'number' ? data : data?.count ?? 0
      setLiveViewers(count)
      console.log('Viewer count updated:', count)
    })

    // Live stopped
    socket.on('live-stopped', () => {
      if (userMode === 'viewer') {
        setWatchingStreamId(null)
        setLiveTitle('')
        setLiveViewers(0)
      }
    })

    // Available streams
    socket.on('streams-updated', (streams: any[]) => {
      setAvailableStreams(streams)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [userMode])

  // ================== BROADCASTER FUNCTIONS ==================

  const startSession = async () => {
    try {
      const res = await axios.post('/api/live-streams/start', { title })
      setSessionId(res.data.sessionId)
      setSavedVideoUrl(null)
      setViewersCount(0)
      setStatus(`Session started: ${res.data.sessionId}`)

      socketRef.current?.emit('start-live', {
        sessionId: res.data.sessionId,
        title,
      })
    } catch (err: any) {
      setStatus('Session start failed: ' + (err.response?.data?.message || err.message))
    }
  }

  const startRecording = async () => {
    if (!sessionId) {
      setStatus('Start session first!')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })

      if (videoRef.current) videoRef.current.srcObject = stream
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Send to server for saving
          const formData = new FormData()
          formData.append('chunk', event.data, 'chunk.webm')

          await axios.post(`/api/live-streams/${sessionId}/chunk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }).catch((err) => console.warn('Chunk upload failed:', err))

          // Broadcast to viewers
          socketRef.current?.emit('video-chunk', {
            sessionId,
            chunk: event.data,
            timestamp: Date.now(),
          })
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setStatus('Recording and streaming started...')
    } catch (err: any) {
      setStatus('Camera/Microphone access failed: ' + err.message)
    }
  }

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }

    if (sessionId) {
      try {
        const res = await axios.post(`/api/live-streams/${sessionId}/end`)
        setSavedVideoUrl(res.data.cloudinaryUrl)
        setStatus(`Video saved! ID: ${res.data.videoId}`)

        socketRef.current?.emit('stop-live', { sessionId })

        setSessionId(null)
        setViewersCount(0)
      } catch (err: any) {
        setStatus('Save failed: ' + (err.response?.data?.message || err.message))
      }
    }
  }

  const cancelStream = async () => {
    stopRecording()
    if (sessionId) {
      try {
        await axios.post(`/api/live-streams/${sessionId}/cancel`)
        setStatus('Stream cancelled')
        setSessionId(null)
        socketRef.current?.emit('stop-live', { sessionId })
      } catch (err) {
        console.error('Cancel error:', err)
      }
    }
  }

  // ================== VIEWER FUNCTIONS ==================

  const getAvailableStreams = (socket: Socket) => {
    socket.emit('get-available-streams', (streams: any[]) => {
      setAvailableStreams(streams)
      console.log('Available streams:', streams)
    })
  }

  const joinLiveStream = (streamSessionId: string, streamTitle: string) => {
    setWatchingStreamId(streamSessionId)
    setLiveTitle(streamTitle)

    socketRef.current?.emit('join-live', { sessionId: streamSessionId })
    setStatus(`Joined stream: ${streamTitle}`)
  }

  const stopWatching = () => {
    if (watchingStreamId) {
      socketRef.current?.emit('leave-live', { sessionId: watchingStreamId })
    }
    setWatchingStreamId(null)
    setLiveTitle('')
    setLiveViewers(0)
    setStatus('Stopped watching')
  }

  const handleVideoChunk = (chunk: Blob) => {
    console.log('Received video chunk:', chunk.size, 'bytes')
    // Add your video rendering logic here (e.g., append to video element or MediaSource)
  }

  const refreshStreams = () => {
    if (socketRef.current) getAvailableStreams(socketRef.current)
  }

  // ================== HOME PAGE ==================
  if (userMode === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Live Stream
          </h1>
          <div className="space-y-4">
            <button
              onClick={() => setUserMode('broadcaster')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-lg transition transform hover:scale-105"
            >
              Create Broadcast
            </button>
            <button
              onClick={() => setUserMode('viewer')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg text-lg transition transform hover:scale-105"
            >
              Watch Broadcast
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ================== BROADCASTER PAGE ==================
  if (userMode === 'broadcaster') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">BROADCASTER</h1>
            <button
              onClick={() => { cancelStream(); setUserMode('home') }}
              className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
            >
              ← Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full aspect-video bg-black"
                />
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-lg">
                  <span className="font-bold">Status:</span>{' '}
                  <span className={status.includes('saved') || status.includes('started') ? 'text-green-400' : 'text-blue-400'}>
                    {status || 'Ready'}
                  </span>
                </p>
                {sessionId && (
                  <p className="text-sm text-gray-400 mt-2">
                    Session ID: <span className="font-mono">{sessionId}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg h-fit">
              <h2 className="text-2xl font-bold mb-6">Controls</h2>

              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Stream Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isRecording || !!sessionId}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded placeholder-gray-400 disabled:opacity-50"
                />
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={startSession}
                  disabled={!!sessionId || isRecording}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 rounded transition disabled:opacity-50"
                >
                  1. Start Session
                </button>

                <button
                  onClick={startRecording}
                  disabled={!sessionId || isRecording}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded transition disabled:opacity-50"
                >
                  2. Start Recording
                </button>

                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 rounded transition disabled:opacity-50"
                >
                  3. Stop & Save
                </button>

                <button
                  onClick={cancelStream}
                  disabled={!sessionId && !isRecording}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-bold py-3 rounded transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              {isRecording && (
                <div className="bg-green-900 p-4 rounded">
                  <p className="text-center">
                    <span className="text-2xl font-bold text-green-400">{viewersCount}</span>
                    <br />
                    <span className="text-sm text-green-300">People Watching</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {savedVideoUrl && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Video Saved!</h2>
              <div className="bg-gray-800 p-4 rounded-lg">
                <video controls className="w-full aspect-video bg-black rounded mb-4">
                  <source src={savedVideoUrl} type="video/mp4" />
                </video>
                <a
                  href={savedVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 break-all"
                >
                  Cloudinary URL
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ================== VIEWER PAGE ==================
  if (userMode === 'viewer') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">VIEWER</h1>
            <button
              onClick={() => { stopWatching(); setUserMode('home') }}
              className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
            >
              ← Back
            </button>
          </div>

          {watchingStreamId ? (
            <div className="space-y-6">
              <div className="bg-red-600 text-white p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">LIVE NOW</p>
                  <p className="text-sm">{liveTitle}</p>
                </div>
                <p className="text-3xl font-bold">{liveViewers}</p>
              </div>

              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  controls
                  autoPlay
                  playsInline
                  className="w-full aspect-video bg-black"
                />
              </div>

              <button
                onClick={stopWatching}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition"
              >
                Stop Watching
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick={refreshStreams}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded transition"
                >
                  Refresh Streams
                </button>
              </div>

              {availableStreams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableStreams.map((stream, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800 p-4 rounded-lg border-2 border-red-600 hover:border-red-500 transition"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-lg font-bold">{stream.title}</p>
                          <p className="text-sm text-gray-400">
                            {stream.viewersCount} watching
                          </p>
                        </div>
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                      </div>

                      <button
                        onClick={() => joinLiveStream(stream.sessionId, stream.title)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition"
                      >
                        Watch Now
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center">
                  <p className="text-gray-400 text-lg mb-4">No live streams available</p>
                  <button
                    onClick={refreshStreams}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded"
                  >
                    Check Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null 
}