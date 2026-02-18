// src/features/videoConvert/videoConvertSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { uploadVideo, convertVideo, downloadVideo } from './videoConvertApi'

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  // Upload state
  uploadStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  uploadProgress: 0,
  uploadedVideo: null,
  uploadError: null,

  // Convert state
  convertStatus: 'idle',
  convertedVideo: null,
  convertError: null,

  // Download state
  downloadStatus: 'idle',
  downloadError: null,

  // UI state
  currentStep: 1, // 1: upload, 2: configure, 3: convert, 4: download
}

// ─── Async Thunks ─────────────────────────────────────────────────────────────

// Upload thunk
export const uploadVideoThunk = createAsyncThunk(
  'videoConvert/upload',
  async ({ file, title }, { rejectWithValue, dispatch }) => {
    try {
      const result = await uploadVideo(file, title, (progress) => {  // ← direct function call
        dispatch(setUploadProgress(progress))
      })
      return result
    } catch (error) {
      return rejectWithValue(error.message || 'Upload failed')
    }
  }
)

// Convert thunk
export const convertVideoThunk = createAsyncThunk(
  'videoConvert/convert',
  async (convertOptions, { rejectWithValue }) => {
    try {
      const result = await convertVideo(convertOptions)  // ← direct function call
      return result
    } catch (error) {
      return rejectWithValue(error.message || 'Conversion failed')
    }
  }
)

// Download thunk
export const downloadVideoThunk = createAsyncThunk(
  'videoConvert/download',
  async (videoId, { rejectWithValue }) => {
    try {
      await downloadVideo(videoId)  // ← direct function call
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message || 'Download failed')
    }
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────

const videoConvertSlice = createSlice({
  name: 'videoConvert',
  initialState,
  reducers: {
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload
    },
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload
    },
    resetVideoConvert: () => initialState,
    clearErrors: (state) => {
      state.uploadError = null
      state.convertError = null
      state.downloadError = null
    },
  },
  extraReducers: (builder) => {
    // ── Upload ──────────────────────────────────────────────────────────────
    builder
      .addCase(uploadVideoThunk.pending, (state) => {
        state.uploadStatus = 'loading'
        state.uploadProgress = 0
        state.uploadError = null
      })
      .addCase(uploadVideoThunk.fulfilled, (state, action) => {
        state.uploadStatus = 'succeeded'
        state.uploadedVideo = action.payload
        state.uploadProgress = 100
        state.currentStep = 2
      })
      .addCase(uploadVideoThunk.rejected, (state, action) => {
        state.uploadStatus = 'failed'
        state.uploadError = action.payload
        state.uploadProgress = 0
      })

    // ── Convert ─────────────────────────────────────────────────────────────
    builder
      .addCase(convertVideoThunk.pending, (state) => {
        state.convertStatus = 'loading'
        state.convertError = null
      })
      .addCase(convertVideoThunk.fulfilled, (state, action) => {
        state.convertStatus = 'succeeded'
        state.convertedVideo = action.payload
        state.currentStep = 4
      })
      .addCase(convertVideoThunk.rejected, (state, action) => {
        state.convertStatus = 'failed'
        state.convertError = action.payload
      })

    // ── Download ────────────────────────────────────────────────────────────
    builder
      .addCase(downloadVideoThunk.pending, (state) => {
        state.downloadStatus = 'loading'
        state.downloadError = null
      })
      .addCase(downloadVideoThunk.fulfilled, (state) => {
        state.downloadStatus = 'succeeded'
      })
      .addCase(downloadVideoThunk.rejected, (state, action) => {
        state.downloadStatus = 'failed'
        state.downloadError = action.payload
      })
  },
})

// ─── Actions ──────────────────────────────────────────────────────────────────

export const {
  setUploadProgress,
  setCurrentStep,
  resetVideoConvert,
  clearErrors,
} = videoConvertSlice.actions

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectUploadStatus = (state) => state.videoConvert.uploadStatus
export const selectUploadProgress = (state) => state.videoConvert.uploadProgress
export const selectUploadedVideo = (state) => state.videoConvert.uploadedVideo
export const selectUploadError = (state) => state.videoConvert.uploadError

export const selectConvertStatus = (state) => state.videoConvert.convertStatus
export const selectConvertedVideo = (state) => state.videoConvert.convertedVideo
export const selectConvertError = (state) => state.videoConvert.convertError

export const selectDownloadStatus = (state) => state.videoConvert.downloadStatus
export const selectDownloadError = (state) => state.videoConvert.downloadError

export const selectCurrentStep = (state) => state.videoConvert.currentStep

export const selectIsLoading = (state) =>
  state.videoConvert.uploadStatus === 'loading' ||
  state.videoConvert.convertStatus === 'loading' ||
  state.videoConvert.downloadStatus === 'loading'

export default videoConvertSlice.reducer