import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { uploadVideoForThumbnails } from './videoThumbnailApi'

const initialState = {
  videoId:        null,
  videoUrl:       null,    // backend video URL for playback
  thumbnails:     [],      // [{ frameNo, timeSecond, imagePath, timeLabel }]
  duration:       0,
  interval:       1,
  thumbnailCount: 0,
  uploadProgress: 0,
  loading:        false,
  error:          null,
}

// ── Thunk: Upload video → get thumbnails ──────────────────────
export const processThumbnails = createAsyncThunk(
  'videoThumbnail/process',
  async (file, { dispatch, rejectWithValue }) => {
    try {
      const data = await uploadVideoForThumbnails(file, (pct) => {
        dispatch(setThumbUploadProgress(pct))
      })
      // data = { videoId, videoUrl, duration, interval, thumbnails, thumbnailCount, ... }
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const videoThumbnailSlice = createSlice({
  name: 'videoThumbnail',
  initialState,
  reducers: {
    setThumbUploadProgress: (state, action) => {
      state.uploadProgress = action.payload
    },
    resetThumbnails: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(processThumbnails.pending, (state) => {
        state.loading  = true
        state.error    = null
        state.uploadProgress = 0
        state.thumbnails     = []
        state.videoId        = null
        state.videoUrl       = null
      })
      .addCase(processThumbnails.fulfilled, (state, action) => {
        state.loading        = false
        state.videoId        = action.payload.videoId
        state.videoUrl       = action.payload.videoUrl
        state.thumbnails     = action.payload.thumbnails
        state.duration       = action.payload.duration
        state.interval       = action.payload.interval
        state.thumbnailCount = action.payload.thumbnailCount
        state.uploadProgress = 100
      })
      .addCase(processThumbnails.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })
  },
})

export const { setThumbUploadProgress, resetThumbnails } = videoThumbnailSlice.actions

// ── Selectors ─────────────────────────────────────────────────
export const selectThumbnails     = (state) => state.videoThumbnail.thumbnails
export const selectThumbVideoUrl  = (state) => state.videoThumbnail.videoUrl
export const selectThumbDuration  = (state) => state.videoThumbnail.duration
export const selectThumbInterval  = (state) => state.videoThumbnail.interval
export const selectThumbLoading   = (state) => state.videoThumbnail.loading
export const selectThumbError     = (state) => state.videoThumbnail.error
export const selectThumbProgress  = (state) => state.videoThumbnail.uploadProgress
export const selectThumbCount     = (state) => state.videoThumbnail.thumbnailCount

export default videoThumbnailSlice.reducer