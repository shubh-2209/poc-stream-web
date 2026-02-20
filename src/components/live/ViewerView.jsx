import { useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from "react-redux"
import {
    selectViewer,
    setAvailableStreams, streamJoined, setConnectionState,
    setViewerStatus, setLiveViewers, viewerReset,
} from '../../features/liveStream/liveStreamSlice'
import { ICE_SERVERS } from '../../features/liveStream/liveStreamApi'
import { selectUser } from '../../features/auth/authSlice'

export default function ViewerView({ onBack, socket }) {
    const dispatch = useDispatch()
    const authUser = useSelector(selectUser)
    const { availableStreams, watchingStreamId, liveTitle, broadcasterName,
            liveViewers, status, connectionState } = useSelector(selectViewer)

    const videoRef    = useRef(null)
    const pcRef       = useRef(null)
    const watchingRef = useRef(watchingStreamId)

    useEffect(() => { watchingRef.current = watchingStreamId }, [watchingStreamId])

    // ─── Refresh stream list ──────────────────────────────────────────────────
    const refreshStreams = useCallback(() => {
        socket?.emit('get-available-streams', (streams) => {
            dispatch(setAvailableStreams(streams || []))
        })
    }, [socket, dispatch])

    useEffect(() => { if (socket) refreshStreams() }, [socket, refreshStreams])

    // ─── Setup WebRTC as viewer ───────────────────────────────────────────────
    const setupWebRTC = useCallback((broadcasterId, sessionId) => {
        pcRef.current?.close()
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
        pcRef.current = pc

        pc.ontrack = ({ streams }) => {
            if (videoRef.current && streams[0]) {
                videoRef.current.srcObject = streams[0]
                videoRef.current.play().catch(console.error)
                dispatch(setViewerStatus('🟢 Watching live'))
            }
        }
        pc.onicecandidate = ({ candidate }) => {
            if (candidate) socket?.emit('ice-candidate', { target: broadcasterId, candidate, sessionId })
        }
        pc.onconnectionstatechange = () => dispatch(setConnectionState(pc.connectionState))

        return pc
    }, [socket, dispatch])

    // ─── Socket listeners ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return

        const onWebrtcOffer = async ({ from, offer, sessionId }) => {
            if (sessionId !== watchingRef.current) return
            const pc = setupWebRTC(from, sessionId)
            await pc.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket.emit('webrtc-answer', { target: from, answer: pc.localDescription, sessionId })
        }
        const onIceCandidate = async ({ candidate }) => {
            if (pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error)
        }
        const onViewerCount = ({ count }) => dispatch(setLiveViewers(count))
        const onLiveStopped = () => {
            dispatch(setViewerStatus('Stream ended'))
            pcRef.current?.close()
            pcRef.current = null
            if (videoRef.current) videoRef.current.srcObject = null
            dispatch(viewerReset())
        }

        socket.on('webrtc-offer',  onWebrtcOffer)
        socket.on('ice-candidate', onIceCandidate)
        socket.on('viewer-count',  onViewerCount)
        socket.on('live-stopped',  onLiveStopped)

        return () => {
            socket.off('webrtc-offer',  onWebrtcOffer)
            socket.off('ice-candidate', onIceCandidate)
            socket.off('viewer-count',  onViewerCount)
            socket.off('live-stopped',  onLiveStopped)
        }
    }, [socket, dispatch, setupWebRTC])

    // ─── Join ─────────────────────────────────────────────────────────────────
    const joinStream = (stream) => {
        const viewerName = authUser?.fullName || authUser?.email || 'Anonymous'

        dispatch(streamJoined({
            sessionId:       stream.sessionId,
            broadcasterId:   stream.broadcasterId,
            title:           stream.title,
            broadcasterName: stream.broadcasterName,
            viewersCount:    stream.viewersCount,
        }))

        socket?.emit('join-live', {
            sessionId: stream.sessionId,
            viewerName,
        })
    }

    // ─── Leave ────────────────────────────────────────────────────────────────
    const stopWatching = () => {
        if (watchingRef.current) {
            socket?.emit('leave-live', { sessionId: watchingRef.current })
        }

        pcRef.current?.close()
        pcRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
        dispatch(viewerReset())
        refreshStreams()
    }

    const isConnecting = ['connecting', 'new'].includes(connectionState)

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Viewer</h1>
                        {authUser && (
                            <p className="text-gray-400 text-sm mt-1">
                                👤 {authUser.fullName || authUser.email}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => { stopWatching(); onBack() }}
                        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
                    >
                        ← Back
                    </button>
                </div>

                {/* ── Watching Mode ── */}
                {watchingStreamId ? (
                    <div className="space-y-4">

                        {/* Stream Info */}
                        <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">LIVE</span>
                                    <span className="font-bold text-lg">{liveTitle}</span>
                                </div>
                                {/* ✅ Broadcaster name */}
                                <p className="text-sm text-purple-400 mt-0.5">
                                    🎙️ {broadcasterName || 'Unknown'}
                                </p>
                                <p className="text-gray-400 text-sm mt-0.5">{status}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{liveViewers}</p>
                                <p className="text-xs text-gray-400">watching</p>
                            </div>
                        </div>

                        {/* Video */}
                        <div className="bg-black rounded-xl overflow-hidden relative">
                            <video
                                ref={videoRef}
                                controls
                                autoPlay
                                playsInline
                                className="w-full aspect-video bg-black"
                            />
                            {isConnecting && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-white">Connecting to broadcaster...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ✅ Leave Stream button */}
                        <button
                            onClick={stopWatching}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition"
                        >
                            Leave Stream
                        </button>
                    </div>

                ) : (
                    /* ── Stream List Mode ── */
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Available Streams</h2>
                            <button
                                onClick={refreshStreams}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg transition"
                            >
                                🔄 Refresh
                            </button>
                        </div>

                        {availableStreams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableStreams.map((stream) => (
                                    <div
                                        key={stream.sessionId}
                                        className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-red-500 transition"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-lg font-bold">{stream.title}</p>
                                                <p className="text-sm text-purple-400 mt-0.5">
                                                    🎙️ {stream.broadcasterName || 'Unknown'}
                                                </p>
                                                <p className="text-sm text-gray-400 mt-0.5">
                                                    {stream.viewersCount} watching
                                                </p>
                                            </div>
                                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mt-1" />
                                        </div>
                                        <button
                                            onClick={() => joinStream(stream)}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition"
                                        >
                                            Watch Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-800 p-10 rounded-xl text-center">
                                <p className="text-gray-400 text-lg mb-4">No live streams available right now</p>
                                <button
                                    onClick={refreshStreams}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg"
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