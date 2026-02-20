import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { registerApi, loginApi, logoutApi } from "./authApi";

const initialState = {
  user:    null,
  token:   null,
  loading: false,
  error:   null,
};

// ── Error extractor ───────────────────────────────────────────
const extractErrorMessage = (error) => {
  const data = error?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (data.errors && Array.isArray(data.errors))
    return data.errors.map((e) => e.message).join(", ");
  if (data.message) return data.message;
  return "Something went wrong. Please try again.";
};

// ── Thunks ────────────────────────────────────────────────────

// Register only — NO auto-login, user must login separately
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      await registerApi(userData);
      return true; // just signal success, no payload needed
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginApi(credentials);
      // AdonisJS returns { token, user } — could be in response.data or response
      // depending on whether apiHelper has a response interceptor
      return response?.data ?? response;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user    = null;
      state.token   = null;
      state.loading = false;
      state.error   = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {

    // ── Register ──────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        // No token/user stored — user must login after registering
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── Login ─────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload?.user   ?? null;
        state.token   = action.payload?.token  ?? null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });

    // ── Logout ────────────────────────────────────────────────
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user    = null;
        state.token   = null;
        state.loading = false;
        state.error   = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Force logout even if API call fails
        state.user    = null;
        state.token   = null;
        state.loading = false;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────────
export const selectUser            = (state) => state.auth.user;
export const selectToken           = (state) => state.auth.token;
export const selectAuthLoading     = (state) => state.auth.loading;
export const selectAuthError       = (state) => state.auth.error;
export const selectIsAuthenticated = (state) => !!state.auth.token;

export default authSlice.reducer;