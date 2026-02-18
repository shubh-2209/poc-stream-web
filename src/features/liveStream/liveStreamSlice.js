import { createSlice } from '@reduxjs/toolkit'

const CONNECTION_STATUS = {
  connected:    '🟢 Connected - Watching live',
  connecting:   '⏳ Connecting...',
  failed:       '❌ Connection failed - try refreshing',
  disconnected: '⚠️ Connection dropped',
}

const initialState = {
  broadcaster: {
    title:         'My Live Stream',
    sessionId:     null,
    isLive:        false,
    status:        'Ready to go live',
    savedVideoUrl: null,
    viewersCount:  0,
  },
  viewer: {
    availableStreams: [],
    watchingStreamId: null,
    broadcasterId:    null,
    liveTitle:        '',
    liveViewers:      0,
    status:           '',
    connectionState:  'new',
  },
}

const liveStreamSlice = createSlice({
  name: 'liveStream',
  initialState,
  reducers: {
    // ── Broadcaster ──────────────────────────────────────────────────────────
    setBroadcasterTitle(state, { payload }) {
      state.broadcaster.title = payload
    },
    liveStarted(state, { payload: { sessionId } }) {
      state.broadcaster.sessionId     = sessionId
      state.broadcaster.isLive        = true
      state.broadcaster.savedVideoUrl = null
      state.broadcaster.status        = '🔴 Live! Waiting for viewers...'
    },
    setBroadcasterStatus(state, { payload }) {
      state.broadcaster.status = payload
    },
    setSavedVideoUrl(state, { payload }) {
      state.broadcaster.savedVideoUrl = payload
    },
    setViewersCount(state, { payload }) {
      state.broadcaster.viewersCount = payload
    },
    liveStopped(state) {
      state.broadcaster.isLive      = false
      state.broadcaster.sessionId   = null
      state.broadcaster.viewersCount = 0
    },
    broadcasterReset(state) {
      state.broadcaster = { ...initialState.broadcaster }
    },

    // ── Viewer ───────────────────────────────────────────────────────────────
    setAvailableStreams(state, { payload }) {
      state.viewer.availableStreams = payload
    },
    streamJoined(state, { payload }) {
      state.viewer.watchingStreamId = payload.sessionId
      state.viewer.broadcasterId    = payload.broadcasterId
      state.viewer.liveTitle        = payload.title
      state.viewer.liveViewers      = payload.viewersCount
      state.viewer.status           = '⏳ Joining stream...'
      state.viewer.connectionState  = 'connecting'
    },
    setConnectionState(state, { payload }) {
      state.viewer.connectionState = payload
      if (CONNECTION_STATUS[payload]) state.viewer.status = CONNECTION_STATUS[payload]
    },
    setViewerStatus(state, { payload }) {
      state.viewer.status = payload
    },
    setLiveViewers(state, { payload }) {
      state.viewer.liveViewers = payload
    },
    viewerReset(state) {
      state.viewer = { ...initialState.viewer }
    },
  },
})

export const {
  setBroadcasterTitle, liveStarted, setBroadcasterStatus,
  setSavedVideoUrl, setViewersCount, liveStopped, broadcasterReset,
  setAvailableStreams, streamJoined, setConnectionState,
  setViewerStatus, setLiveViewers, viewerReset,
} = liveStreamSlice.actions

export const selectBroadcaster = (state) => state.liveStream.broadcaster
export const selectViewer      = (state) => state.liveStream.viewer

export default liveStreamSlice.reducer