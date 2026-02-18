import { useRef, useCallback } from 'react'
import { liveStreamApi } from '../features/liveStream/liveStreamApi'

const getSupportedMimeType = () => {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) return 'video/webm;codecs=vp9,opus'
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) return 'video/webm;codecs=vp8,opus'
  return 'video/webm'
}

export function useMediaRecorder() {
  const recorderRef = useRef(null)

  const start = useCallback((stream, sessionId) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: getSupportedMimeType(),
      videoBitsPerSecond: 2_500_000,
    })

    recorder.ondataavailable = async ({ data }) => {
      if (data.size === 0) return
      const fd = new FormData()
      fd.append('chunk', data, `chunk-${Date.now()}.webm`)
      await liveStreamApi.uploadChunk(sessionId, fd).catch(console.error)
    }

    recorder.start(2000)
    recorderRef.current = recorder
  }, [])

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      recorderRef.current = null
    }
  }, [])

  return { start, stop }
}