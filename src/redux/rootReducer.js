import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import videosReducer from "../features/videos/videosSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  videos: videosReducer,
});

export default rootReducer;