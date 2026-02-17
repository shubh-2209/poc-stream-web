import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import videoThumbnailReducer from "../features/videoThumbnail/videoThumbnailSlice"

const rootReducer = combineReducers({
  auth: authReducer, 
  videoThumbnail: videoThumbnailReducer,
});

export default rootReducer;