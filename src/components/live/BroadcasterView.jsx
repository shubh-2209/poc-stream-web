import { useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from "react-redux";
import {
    selectBroadcaster,
    setBroadcasterTitle, liveStarted, setBroadcasterStatus,
    setSavedVideoUrl, setViewersCount, liveStopped, broadcasterReset,
} from '../../features/liveStream/liveStreamSlice'
import { liveStreamApi, ICE_SERVERS } from '../../features/liveStream/liveStreamApi'
import { useMediaRecorder } from '../../hooks/useMediaRecorder'

export default function BroadcasterView({ onBack, socket }) {
    const dispatch = useDispatch()
    const { title, sessionId, isLive, status, savedVideoUrl, viewersCount } = useSelector(selectBroadcaster)

    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const peersRef = useRef(new Map())           // viewerId → RTCPeerConnection
    const sessionRef = useRef(sessionId)           // stale-closure-safe mirror of sessionId
    const { start: startRecording, stop: stopRecording } = useMediaRecorder()

    useEffect(() => { sessionRef.current = sessionId }, [sessionId])

    // ─── Create peer for a viewer ─────────────────────────────────────────────
    const createPeerForViewer = useCallback(async (viewerId, currentSessionId) => {
        if (!streamRef.current || peersRef.current.has(viewerId)) return

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
        peersRef.current.set(viewerId, pc)

        streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current))

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) socket?.emit('ice-candidate', { target: viewerId, candidate, sessionId: currentSessionId })
        }
        pc.onconnectionstatechange = () => {
            if (['failed', 'closed'].includes(pc.connectionState)) peersRef.current.delete(viewerId)
        }

        const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false })
        await pc.setLocalDescription(offer)
        socket?.emit('webrtc-offer', { target: viewerId, offer: pc.localDescription, sessionId: currentSessionId })
    }, [socket])

    // ─── Socket listeners ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return

        const onViewerJoined = ({ viewerId, sessionId: sid }) => {
            if (sid === sessionRef.current) createPeerForViewer(viewerId, sid)
        }
        const onWebrtcAnswer = async ({ from, answer }) => {
            const pc = peersRef.current.get(from)
            if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(new RTCSessionDescription(answer))
        }
        const onIceCandidate = async ({ from, candidate }) => {
            const pc = peersRef.current.get(from)
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error)
        }
        const onViewerLeft = ({ viewerId }) => {
            const pc = peersRef.current.get(viewerId)
            if (pc) { pc.close(); peersRef.current.delete(viewerId) }
        }
        const onViewerCount = ({ count }) => dispatch(setViewersCount(count))

        socket.on('viewer-joined', onViewerJoined)
        socket.on('webrtc-answer', onWebrtcAnswer)
        socket.on('ice-candidate', onIceCandidate)
        socket.on('viewer-left', onViewerLeft)
        socket.on('viewer-count', onViewerCount)

        return () => {
            socket.off('viewer-joined', onViewerJoined)
            socket.off('webrtc-answer', onWebrtcAnswer)
            socket.off('ice-candidate', onIceCandidate)
            socket.off('viewer-left', onViewerLeft)
            socket.off('viewer-count', onViewerCount)
        }
    }, [socket, dispatch, createPeerForViewer])

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const cleanupPeers = () => { peersRef.current.forEach((pc) => pc.close()); peersRef.current.clear() }
    const cleanupStream = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
    }

    // ─── Go Live ──────────────────────────────────────────────────────────────
    const startLive = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                audio: { echoCancellation: true, noiseSuppression: true },
            })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream

            const { data } = await liveStreamApi.startSession(title)
            startRecording(stream, data.sessionId)
            socket?.emit('start-live', { sessionId: data.sessionId, title })
            dispatch(liveStarted({ sessionId: data.sessionId }))
        } catch (err) {
            dispatch(setBroadcasterStatus('Error: ' + err.message))
        }
    }

    // ─── Stop & Save ──────────────────────────────────────────────────────────
    const stopLive = async () => {
        stopRecording()
        cleanupStream()
        cleanupPeers()
        const sid = sessionRef.current
        socket?.emit('stop-live', { sessionId: sid })
        dispatch(liveStopped())
        dispatch(setBroadcasterStatus('Saving video...'))
        try {
            await new Promise((r) => setTimeout(r, 2000))
            const { data } = await liveStreamApi.endSession(sid)
            const url = data.cloudinaryUrl || data.url || data.videoUrl || ''
            dispatch(setSavedVideoUrl(url))
            dispatch(setBroadcasterStatus('✅ Video saved to Cloudinary!'))
        } catch (err) {
            dispatch(setBroadcasterStatus('Save failed: ' + (err.response?.data?.message || err.message)))
        }
    }

    // ─── Cancel ───────────────────────────────────────────────────────────────
    const handleCancel = async () => {
        if (isLive) { await stopLive() }
        else {
            stopRecording(); cleanupStream(); cleanupPeers()
            const sid = sessionRef.current
            if (sid) { socket?.emit('stop-live', { sessionId: sid }); await liveStreamApi.cancelSession(sid) }
        }
        dispatch(broadcasterReset())
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold">Broadcaster</h1>
                        {isLive && (
                            <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">LIVE</span>
                        )}
                    </div>
                    <button onClick={() => { handleCancel(); onBack() }} className="w-auto bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
                        ← Back
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Preview + Status */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-black rounded-xl overflow-hidden relative">
                            <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video bg-black" />
                            {!isLive && (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                                    <p className="text-lg">Camera preview will appear here</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl">
                            <p className="text-gray-300">
                                <span className="font-bold text-white">Status: </span>
                                <span className={isLive ? 'text-green-400' : 'text-blue-400'}>{status}</span>
                            </p>
                            {sessionId && <p className="text-sm text-gray-500 mt-1 font-mono">ID: {sessionId}</p>}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="bg-gray-800 p-6 rounded-xl space-y-4">
                        <h2 className="text-xl font-bold">Controls</h2>
                        <input
                            type="text"
                            placeholder="Stream Title"
                            value={title}
                            onChange={(e) => dispatch(setBroadcasterTitle(e.target.value))}
                            disabled={isLive}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {!isLive ? (
                            <button onClick={startLive} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition text-lg">
                                🎥 Go Live
                            </button>
                        ) : (
                            <button onClick={stopLive} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition text-lg">
                                ⏹ Stop & Save
                            </button>
                        )}
                        <button onClick={handleCancel} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition">
                            Cancel
                        </button>
                        {isLive && (
                            <div className="bg-red-900/50 border border-red-600 p-4 rounded-xl text-center">
                                <p className="text-4xl font-bold">{viewersCount}</p>
                                <p className="text-sm text-red-300 mt-1">Watching Now</p>
                            </div>
                        )}
                        <div className="bg-gray-700/50 p-3 rounded-lg text-xs text-gray-400 space-y-1">
                            <p>✅ WebRTC = Zero latency streaming</p>
                            <p>✅ Recording saved to Cloudinary</p>
                            <p>✅ MP4 format (FFmpeg conversion)</p>
                        </div>
                    </div>
                </div>

                {savedVideoUrl && (
                    <div className="mt-8 bg-gray-800 p-6 rounded-xl">
                        <h2 className="text-2xl font-bold mb-4">✅ Video Saved!</h2>
                        <video controls className="w-full max-w-2xl aspect-video bg-black rounded-lg mb-4">
                            <source src={savedVideoUrl} type="video/mp4" />
                        </video>
                        <a href={savedVideoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all text-sm">
                            {savedVideoUrl}
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}