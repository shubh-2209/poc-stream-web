// import { useRef, useEffect, useCallback, useState } from 'react'
// import { useDispatch, useSelector } from "react-redux"
// import {
//     selectBroadcaster,
//     setBroadcasterTitle, liveStarted, setBroadcasterStatus,
//     setSavedVideoUrl, setViewersCount, liveStopped, broadcasterReset,
//     setViewerList, setBroadcasterInfo,
// } from '../../features/liveStream/liveStreamSlice'
// import { selectUser, selectToken } from '../../features/auth/authSlice'
// import { liveStreamApi, ICE_SERVERS } from '../../features/liveStream/liveStreamApi'
// import { useMediaRecorder } from '../../hooks/useMediaRecorder'

// export default function BroadcasterView({ onBack, socket }) {
//     const dispatch = useDispatch()
//     const { title, sessionId, isLive, status, savedVideoUrl, viewersCount, viewerList, broadcasterInfo } =
//         useSelector(selectBroadcaster)

//     const authUser  = useSelector(selectUser)
//     const authToken = useSelector(selectToken)

//     const videoRef   = useRef(null)
//     const streamRef  = useRef(null)
//     const peersRef   = useRef(new Map())           // viewerId → RTCPeerConnection
//     const sessionRef = useRef(sessionId)           // stale-closure-safe mirror of sessionId
//     const canvasRef  = useRef(null)
//     const { start: startRecording, stop: stopRecording } = useMediaRecorder()

//     const {
//         processingMode,
//         backgroundType,
//         faceFilterType,
//         screenFilter,
//         selectedBgId,
//         processedStreamRef,
//         startProcessing,
//         switchProcessingMode,
//         switchBackgroundType,
//         switchFaceFilter,
//         switchScreenFilter,
//         selectBgImage,
//         cleanupProcessing,
//     } = useVideoProcessing({ canvasRef })

//     useEffect(() => { sessionRef.current = sessionId }, [sessionId])

//     useEffect(() => {
//         if (authUser) {
//             dispatch(setBroadcasterInfo(authUser))
//         }
//     }, [authUser, dispatch])

//     // ─── Helpers — kept as plain functions per upstream ───────────────────────
//     const cleanupPeers = () => {
//         peersRef.current.forEach((pc) => pc.close())
//         peersRef.current.clear()
//     }

//     const cleanupStream = () => {
//         streamRef.current?.getTracks().forEach((t) => t.stop())
//         streamRef.current = null
//         if (videoRef.current) videoRef.current.srcObject = null
//     }

//     // ─── Create peer ──────────────────────────────────────────────────────────
//     const createPeerForViewer = useCallback(async (viewerId, currentSessionId) => {
//         if (!streamRef.current || peersRef.current.has(viewerId)) return

//         const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
//         peersRef.current.set(viewerId, pc)

//         // Use processed stream if active, else raw stream
//         const activeStream = processedStreamRef.current || streamRef.current
//         activeStream.getTracks().forEach((track) => pc.addTrack(track, activeStream))

//         pc.onicecandidate = ({ candidate }) => {
//             if (candidate) socket?.emit('ice-candidate', { target: viewerId, candidate, sessionId: currentSessionId })
//         }
//         pc.onconnectionstatechange = () => {
//             if (['failed', 'closed'].includes(pc.connectionState)) peersRef.current.delete(viewerId)
//         }
//         const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false })
//         await pc.setLocalDescription(offer)
//         socket?.emit('webrtc-offer', { target: viewerId, offer: pc.localDescription, sessionId: currentSessionId })
//     }, [socket, processedStreamRef])

//     useEffect(() => {
//         if (!socket) return
//         const onViewerJoined  = ({ viewerId, sessionId: sid }) => {
//             if (sid === sessionRef.current) createPeerForViewer(viewerId, sid)
//         }
//         const onWebrtcAnswer  = async ({ from, answer }) => {
//             const pc = peersRef.current.get(from)
//             if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(new RTCSessionDescription(answer))
//         }
//         const onIceCandidate  = async ({ from, candidate }) => {
//             const pc = peersRef.current.get(from)
//             if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error)
//         }
//         const onViewerLeft    = ({ viewerId }) => {
//             const pc = peersRef.current.get(viewerId)
//             if (pc) { pc.close(); peersRef.current.delete(viewerId) }
//         }
//         const onViewerCount   = ({ count }) => dispatch(setViewersCount(count))
//         const onViewerList    = ({ viewers }) => dispatch(setViewerList(viewers))

//         socket.on('viewer-joined', onViewerJoined)
//         socket.on('webrtc-answer', onWebrtcAnswer)
//         socket.on('ice-candidate', onIceCandidate)
//         socket.on('viewer-left',   onViewerLeft)
//         socket.on('viewer-count',  onViewerCount)
//         socket.on('viewer-list',   onViewerList)

//         return () => {
//             socket.off('viewer-joined', onViewerJoined)
//             socket.off('webrtc-answer', onWebrtcAnswer)
//             socket.off('ice-candidate', onIceCandidate)
//             socket.off('viewer-left',   onViewerLeft)
//             socket.off('viewer-count',  onViewerCount)
//             socket.off('viewer-list',   onViewerList)
//         }
//     }, [socket, dispatch, createPeerForViewer])

//     const startLive = async () => {
//         try {
//             if (!authToken) {
//                 dispatch(setBroadcasterStatus('❌ Please login first'))
//                 return
//             }

//             const stream = await navigator.mediaDevices.getUserMedia({
//                 video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
//                 audio: { echoCancellation: true, noiseSuppression: true },
//             })
//             streamRef.current = stream

//             // startProcessing returns canvas stream (processed) or null (pure raw)
//             const processedStream = await startProcessing(stream)

//             if (videoRef.current) videoRef.current.srcObject = processedStream || stream

//             const { data } = await liveStreamApi.startSession(title, authToken)
//             startRecording(stream, data.sessionId)

//             socket?.emit('start-live', {
//                 sessionId:       data.sessionId,
//                 title,
//                 broadcasterName: authUser?.fullName || authUser?.email || 'Anonymous',
//             })
//             dispatch(liveStarted({ sessionId: data.sessionId }))
//         } catch (err) {
//             dispatch(setBroadcasterStatus('Error: ' + err.message))
//         }
//     }

//     // ─── Mode switch handler ──────────────────────────────────────────────────
//     const handleSwitchProcessingMode = useCallback(async (newMode) => {
//         const stream = await switchProcessingMode(newMode, streamRef.current, videoRef)
//         if (stream === null && videoRef.current && streamRef.current) {
//             videoRef.current.srcObject = streamRef.current
//         }
//     }, [switchProcessingMode])

//     // ─── Stop & Save — from upstream (no isCancelled check) ──────────────────
//     const stopLive = async () => {
//         stopRecording()
//         cleanupProcessing()
//         cleanupStream()
//         cleanupPeers()
//         const sid = sessionRef.current
//         socket?.emit('stop-live', { sessionId: sid })
//         dispatch(liveStopped())
//         dispatch(setViewerList([]))
//         dispatch(setBroadcasterStatus('Saving video...'))
//         try {
//             await new Promise((r) => setTimeout(r, 2000))
//             const { data } = await liveStreamApi.endSession(sid, authToken)
//             dispatch(setSavedVideoUrl(data.cloudinaryUrl || ''))
//             dispatch(setBroadcasterStatus('✅ Video saved to Cloudinary!'))
//         } catch (err) {
//             dispatch(setBroadcasterStatus('Save failed: ' + (err.response?.data?.message || err.message)))
//         }
//     }

//     // ─── Cancel — from upstream (with Hindi comments + setSavedVideoUrl) ──────
//     const handleCancel = async () => {
//         // 1. Hamesha recording aur stream cleanup karo
//         stopRecording()
//         cleanupProcessing()
//         cleanupStream()
//         cleanupPeers()

//         const sid = sessionRef.current

//         if (sid) {
//             // Sirf cancel API hit karo — end nahi
//             socket?.emit('stop-live', { sessionId: sid })
//             try { await liveStreamApi.cancelSession(sid, authToken) } catch {}
//         }
//         dispatch(broadcasterReset())
//         dispatch(setSavedVideoUrl(null))   // extra safety (fixed: dispatch required)
//     }

//     // ─── Render ───────────────────────────────────────────────────────────────
//     return (
//         <div className="min-h-screen bg-gray-900 text-white p-6">
//             <div className="max-w-6xl mx-auto">

//                 <div className="flex items-center justify-between mb-8">
//                     <div className="flex items-center gap-4">
//                         <div>
//                             <h1 className="text-3xl font-bold">Broadcaster</h1>
//                             {authUser && (
//                                 <p className="text-gray-400 text-sm mt-1">
//                                     👤 {authUser.fullName || authUser.email}
//                                 </p>
//                             )}
//                         </div>
//                         {isLive && (
//                             <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">LIVE</span>
//                         )}
//                     </div>
//                     <button onClick={() => { handleCancel(); onBack() }} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
//                         ← Back
//                     </button>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                     <div className="lg:col-span-2 space-y-4">
//                         <div className="bg-black rounded-xl overflow-hidden relative">
//                             <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video bg-black" />
//                             {!isLive && (
//                                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
//                                     <p className="text-lg">Camera preview will appear here</p>
//                                 </div>
//                             )}
//                         </div>
//                         <div className="bg-gray-800 p-4 rounded-xl">
//                             <p className="text-gray-300">
//                                 <span className="font-bold text-white">Status: </span>
//                                 <span className={isLive ? 'text-green-400' : 'text-blue-400'}>{status}</span>
//                             </p>
//                             {sessionId && <p className="text-sm text-gray-500 mt-1 font-mono">ID: {sessionId}</p>}
//                         </div>
//                     </div>

//                     <div className="bg-gray-800 p-6 rounded-xl space-y-4">
//                         <h2 className="text-xl font-bold">Controls</h2>
//                         <input
//                             type="text"
//                             placeholder="Stream Title"
//                             value={title}
//                             onChange={(e) => dispatch(setBroadcasterTitle(e.target.value))}
//                             disabled={isLive}
//                             className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
//                         />
//                         {!isLive ? (
//                             <button onClick={startLive} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition text-lg">
//                                 🎥 Go Live
//                             </button>
//                         ) : (
//                             <button onClick={stopLive} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition text-lg">
//                                 ⏹ Stop & Save
//                             </button>
//                         )}
//                         <button onClick={handleCancel} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition">
//                             Cancel
//                         </button>

//                         {isLive && (
//                             <>
//                                 <div className="bg-red-900/50 border border-red-600 p-4 rounded-xl text-center">
//                                     <p className="text-4xl font-bold">{viewersCount}</p>
//                                     <p className="text-sm text-red-300 mt-1">Watching Now</p>
//                                 </div>

//                                 {viewerList.length > 0 && (
//                                     <div className="bg-gray-700 rounded-xl p-4">
//                                         <h3 className="text-sm font-bold text-gray-300 mb-3">
//                                             👥 Viewers ({viewerList.length})
//                                         </h3>
//                                         <div className="space-y-2 max-h-48 overflow-y-auto">
//                                             {viewerList.map((viewer) => (
//                                                 <div key={viewer.id} className="flex items-center gap-2 text-sm">
//                                                     <span className="w-2 h-2 bg-green-400 rounded-full" />
//                                                     <span className="text-white">{viewer.name}</span>
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                             </>
//                         )}
//                     </div>
//                 </div>

//           {savedVideoUrl && (
//             <div className="mt-8 bg-gray-800 p-6 rounded-xl">
//               <h2 className="text-2xl font-bold mb-4">✅ Video Saved!</h2>
//               <video
//                 controls
//                 className="w-full max-w-2xl aspect-video bg-black rounded-lg mb-4"
//               >
//                 <source src={savedVideoUrl} type="video/mp4" />
//               </video>
//               <a
//                 href={savedVideoUrl}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-400 hover:text-blue-300 break-all text-sm"
//               >
//                 {savedVideoUrl}
//               </a>
//             </div>
//           )}
//         </div>
//       </div>
//     );
// }

import { useRef, useEffect, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectBroadcaster,
  setBroadcasterTitle,
  liveStarted,
  setBroadcasterStatus,
  setSavedVideoUrl,
  setViewersCount,
  liveStopped,
  broadcasterReset,
  setViewerList,
  setBroadcasterInfo,
} from "../../features/liveStream/liveStreamSlice";
import { selectUser, selectToken } from "../../features/auth/authSlice";
import {
  liveStreamApi,
  ICE_SERVERS,
} from "../../features/liveStream/liveStreamApi";
import { useMediaRecorder } from "../../hooks/useMediaRecorder";
import {
  useVideoProcessing,
  BG_IMAGES,
  SCREEN_FILTERS,
  PROCESSING_MODES,
  BACKGROUND_TYPES,
  FACE_FILTER_TYPES,
} from "../../hooks/video-processing/useVideoProcessing.js";

import ChatBox from "../ChatBox";

export default function BroadcasterView({ onBack, socket }) {
  const dispatch = useDispatch();
  const {
    title,
    sessionId,
    isLive,
    status,
    savedVideoUrl,
    viewersCount,
    viewerList,
    broadcasterInfo,
  } = useSelector(selectBroadcaster);

  const authUser = useSelector(selectUser);
  const authToken = useSelector(selectToken);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef(new Map()); // viewerId → RTCPeerConnection
  const sessionRef = useRef(sessionId); // stale-closure-safe mirror of sessionId
  const canvasRef = useRef(null);
  const { start: startRecording, stop: stopRecording } = useMediaRecorder();

  const {
    processingMode,
    backgroundType,
    faceFilterType,
    screenFilter,
    selectedBgId,
    processedStreamRef,
    startProcessing,
    switchProcessingMode,
    switchBackgroundType,
    switchFaceFilter,
    switchScreenFilter,
    selectBgImage,
    cleanupProcessing,
  } = useVideoProcessing({ canvasRef });

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (authUser) {
      dispatch(setBroadcasterInfo(authUser));
    }
  }, [authUser, dispatch]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const cleanupPeers = () => {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
  };

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // ─── Create peer ──────────────────────────────────────────────────────────
  const createPeerForViewer = useCallback(
    async (viewerId, currentSessionId) => {
      if (!streamRef.current || peersRef.current.has(viewerId)) return;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peersRef.current.set(viewerId, pc);

      // Use processed stream if active, else raw stream
      const activeStream = processedStreamRef.current || streamRef.current;
      activeStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, activeStream));

      pc.onicecandidate = ({ candidate }) => {
        if (candidate)
          socket?.emit("ice-candidate", {
            target: viewerId,
            candidate,
            sessionId: currentSessionId,
          });
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "closed"].includes(pc.connectionState))
          peersRef.current.delete(viewerId);
      };
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      socket?.emit("webrtc-offer", {
        target: viewerId,
        offer: pc.localDescription,
        sessionId: currentSessionId,
      });
    },
    [socket, processedStreamRef],
  );

  useEffect(() => {
    if (!socket) return;
    const onViewerJoined = ({ viewerId, sessionId: sid }) => {
      if (sid === sessionRef.current) createPeerForViewer(viewerId, sid);
    };
    const onWebrtcAnswer = async ({ from, answer }) => {
      const pc = peersRef.current.get(from);
      if (pc && pc.signalingState !== "stable")
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };
    const onIceCandidate = async ({ from, candidate }) => {
      const pc = peersRef.current.get(from);
      if (pc)
        await pc
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(console.error);
    };
    const onViewerLeft = ({ viewerId }) => {
      const pc = peersRef.current.get(viewerId);
      if (pc) {
        pc.close();
        peersRef.current.delete(viewerId);
      }
    };
    const onViewerCount = ({ count }) => dispatch(setViewersCount(count));
    const onViewerList = ({ viewers }) => dispatch(setViewerList(viewers));

    socket.on("viewer-joined", onViewerJoined);
    socket.on("webrtc-answer", onWebrtcAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("viewer-left", onViewerLeft);
    socket.on("viewer-count", onViewerCount);
    socket.on("viewer-list", onViewerList);

    return () => {
      socket.off("viewer-joined", onViewerJoined);
      socket.off("webrtc-answer", onWebrtcAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("viewer-left", onViewerLeft);
      socket.off("viewer-count", onViewerCount);
      socket.off("viewer-list", onViewerList);
    };
  }, [socket, dispatch, createPeerForViewer]);

  const startLive = async () => {
    try {
      if (!authToken) {
        dispatch(setBroadcasterStatus("❌ Please login first"));
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      // startProcessing returns canvas stream (processed) or null (pure raw)
      const processedStream = await startProcessing(stream);

      if (videoRef.current)
        videoRef.current.srcObject = processedStream || stream;

      const streamToRecord = processedStreamRef.current || stream;
      const { data } = await liveStreamApi.startSession(title, authToken);
      startRecording(streamToRecord, data.sessionId);
      socket?.emit("start-live", {
        sessionId: data.sessionId,
        title,
        broadcasterName: authUser?.fullName || authUser?.email || "Anonymous",
      });
      dispatch(liveStarted({ sessionId: data.sessionId }));
    } catch (err) {
      dispatch(setBroadcasterStatus("Error: " + err.message));
    }
  };

  // ─── Mode switch handler ──────────────────────────────────────────────────
  const handleSwitchProcessingMode = useCallback(
    async (newMode) => {
      const stream = await switchProcessingMode(
        newMode,
        streamRef.current,
        videoRef,
      );
      if (stream === null && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    },
    [switchProcessingMode],
  );

  // ─── Stop & Save ──────────────────────────────────────────────────────────
  const stopLive = async () => {
    stopRecording();
    cleanupProcessing();
    cleanupStream();
    cleanupPeers();
    const sid = sessionRef.current;
    socket?.emit("stop-live", { sessionId: sid });
    dispatch(liveStopped());
    dispatch(setViewerList([]));
    dispatch(setBroadcasterStatus("Saving video..."));
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const { data } = await liveStreamApi.endSession(sid, authToken);
      const url = data.cloudinaryUrl || data.url || data.videoUrl || "";
      dispatch(setSavedVideoUrl(url));
      dispatch(setBroadcasterStatus("✅ Video saved to Cloudinary!"));
    } catch (err) {
      dispatch(
        setBroadcasterStatus(
          "Save failed: " + (err.response?.data?.message || err.message),
        ),
      );
    }
  };

  // ─── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    stopRecording();
    cleanupProcessing();
    cleanupStream();
    cleanupPeers();

    const sid = sessionRef.current;

    if (sid) {
      socket?.emit("stop-live", { sessionId: sid });
      try {
        await liveStreamApi.cancelSession(sid, authToken);
        dispatch(setBroadcasterStatus("Stream cancelled successfully"));
      } catch (err) {
        console.error("Cancel API failed:", err);
        dispatch(setBroadcasterStatus("Cancel failed, but local cleanup done"));
      }
    }

    dispatch(broadcasterReset());
    dispatch(setSavedVideoUrl(null));
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Broadcaster</h1>
              {authUser && (
                <p className="text-gray-400 text-sm mt-1">
                  👤 {authUser.fullName || authUser.email}
                </p>
              )}
            </div>
            {isLive && (
              <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <button
            onClick={() => {
              handleCancel();
              onBack();
            }}
            className="w-auto bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview + Status */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-black rounded-xl overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full aspect-video bg-black"
              />
              {!isLive && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                  <p className="text-lg">Camera preview will appear here</p>
                </div>
              )}
            </div>

            {/* Hidden canvas — used by ProcessingEngine */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="bg-gray-800 p-4 rounded-xl">
              <p className="text-gray-300">
                <span className="font-bold text-white">Status: </span>
                <span className={isLive ? "text-green-400" : "text-blue-400"}>
                  {status}
                </span>
              </p>
              {sessionId && (
                <p className="text-sm text-gray-500 mt-1 font-mono">
                  ID: {sessionId}
                </p>
              )}
            </div>

            {/* ✅ ChatBox — Live hone par video ke neeche dikhega */}
            {isLive && sessionId && (
              <div>
                <ChatBox sessionId={sessionId} socket={socket} />
              </div>
            )}
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

            {/* ── Processing Mode ──────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-300">Mode</p>
              <div className="flex gap-2">
                {[
                  { id: PROCESSING_MODES.RAW, label: "Raw" },
                  { id: PROCESSING_MODES.BACKGROUND, label: "Background" },
                  { id: PROCESSING_MODES.FACE, label: "Face Filter" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => handleSwitchProcessingMode(id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition
                                            ${
                                              processingMode === id
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Background sub-options ───────────────────────── */}
            {processingMode === PROCESSING_MODES.BACKGROUND && (
              <div className="space-y-2 border border-gray-700 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-400">
                  Background Type
                </p>
                <div className="flex gap-2">
                  {[
                    { id: BACKGROUND_TYPES.RAW, label: "Raw" },
                    { id: BACKGROUND_TYPES.BLUR, label: "Blur" },
                    { id: BACKGROUND_TYPES.REPLACE, label: "Replace" },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => switchBackgroundType(id)}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition
                                                ${
                                                  backgroundType === id
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {backgroundType === BACKGROUND_TYPES.REPLACE && (
                  <div className="flex gap-2 flex-wrap pt-1">
                    {BG_IMAGES.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => selectBgImage(img.id)}
                        className={`rounded-lg overflow-hidden border-2 transition
                                                    ${
                                                      selectedBgId === img.id
                                                        ? "border-purple-500"
                                                        : "border-transparent hover:border-gray-500"
                                                    }`}
                      >
                        <img
                          src={img.src}
                          alt=""
                          className="w-24 h-16 object-cover block"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Face filter sub-options ──────────────────────── */}
            {processingMode === PROCESSING_MODES.FACE && (
              <div className="space-y-2 border border-gray-700 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-400">
                  Face Filter
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: FACE_FILTER_TYPES.DOG, label: "🐶 Dog" },
                    { id: FACE_FILTER_TYPES.CAT, label: "🐱 Cat" },
                    { id: FACE_FILTER_TYPES.GLASSES, label: "👓 Glasses" },
                    { id: FACE_FILTER_TYPES.BEARD, label: "🧔 Beard" },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => switchFaceFilter(id)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition
                                                ${
                                                  faceFilterType === id
                                                    ? "bg-green-600 text-white"
                                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Screen Filters ───────────────────────────────── */}
            <div className="space-y-2 border border-gray-700 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-400">
                Screen Filter
              </p>
              <div className="flex gap-1 flex-wrap">
                {SCREEN_FILTERS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => switchScreenFilter(id)}
                    className={`px-2 py-1 rounded text-xs font-semibold transition
                                            ${
                                              screenFilter === id
                                                ? "bg-yellow-600 text-white"
                                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Go Live / Stop & Save ────────────────────────── */}
            {!isLive ? (
              <button
                onClick={startLive}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition text-lg"
              >
                🎥 Go Live
              </button>
            ) : (
              <button
                onClick={stopLive}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition text-lg"
              >
                ⏹ Stop & Save
              </button>
            )}
            <button
              onClick={handleCancel}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition"
            >
              Cancel
            </button>

            {isLive && (
              <>
                <div className="bg-red-900/50 border border-red-600 p-4 rounded-xl text-center">
                  <p className="text-4xl font-bold">{viewersCount}</p>
                  <p className="text-sm text-red-300 mt-1">Watching Now</p>
                </div>

                {viewerList.length > 0 && (
                  <div className="bg-gray-700 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-3">
                      👥 Viewers ({viewerList.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {viewerList.map((viewer) => (
                        <div
                          key={viewer.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="text-white">{viewer.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {savedVideoUrl && (
          <div className="mt-8 bg-gray-800 p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4">✅ Video Saved!</h2>
            <video
              controls
              className="w-full max-w-2xl aspect-video bg-black rounded-lg mb-4"
            >
              <source src={savedVideoUrl} type="video/mp4" />
            </video>
            <a
              href={savedVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 break-all text-sm"
            >
              {savedVideoUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
