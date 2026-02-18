import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import videoThumbnailReducer from "../features/videoThumbnail/videoThumbnailSlice"
import videosReducer from "../features/videos/videosSlice";
import videoConvertReducer from "../features/videoConvert/videoConvertSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  videoThumbnail: videoThumbnailReducer,
  videos: videosReducer,
  videoConvert: videoConvertReducer,
});

export default rootReducer;