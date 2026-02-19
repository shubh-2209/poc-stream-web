import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/apiHelper";

const initialState = {
  videos: [],
  currentPage: 1,
  hasMore: true,
  loading: false,
  error: null,
};

export const fetchVideos = createAsyncThunk(
  "videos/fetchVideos",
  async ({ page = 1, limit = 1000,type }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/videos?page=${page}&limit=${limit}&type=${type}`);
      return {
        videos: response.data || response.videos || [],
        page,
        hasMore: response.data?.length === limit || response.videos?.length === limit,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch videos"
      );
    }
  }
);

const videosSlice = createSlice({
  name: "videos",
  initialState,
  reducers: {
    resetVideos: (state) => {
      state.videos = [];
      state.currentPage = 1;
      state.hasMore = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false;
        const { videos, page, hasMore } = action.payload;
        
        if (page === 1) {
          state.videos = videos;
        } else {
          state.videos = [...state.videos, ...videos];
        }
        
        state.currentPage = page;
        state.hasMore = hasMore;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetVideos, clearError } = videosSlice.actions;

export const selectVideos = (state) => state.videos.videos;
export const selectVideosLoading = (state) => state.videos.loading;
export const selectVideosError = (state) => state.videos.error;
export const selectCurrentPage = (state) => state.videos.currentPage;
export const selectHasMore = (state) => state.videos.hasMore;

export default videosSlice.reducer;
