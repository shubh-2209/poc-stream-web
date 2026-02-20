// features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchChatsBySession } from "./chatApi";

export const getChats = createAsyncThunk("chat/getChats", async (sessionId) => {
  return await fetchChatsBySession(sessionId);
});

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    loading: false,
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      if (!Array.isArray(state.messages)) {
        state.messages = [];
      }
      state.messages.push(action.payload);
    },
    clearChat: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getChats.pending, (state) => {
        state.loading = true;
      })
      // .addCase(getChats.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.messages = Array.isArray(action.payload) ? action.payload : [];
      // })
      .addCase(getChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getChats.fulfilled, (state, action) => {
        console.log("API returned:", action.payload);
        state.loading = false;
        state.messages = Array.isArray(action.payload) ? action.payload : [];
      });

  },
});

export const { addMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
