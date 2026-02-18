import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import videoThumbnailReducer from "../features/videoThumbnail/videoThumbnailSlice"
import videosReducer from "../features/videos/videosSlice";
import liveStreamReducer from "../features/liveStream/liveStreamSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  videoThumbnail: videoThumbnailReducer,
  videos: videosReducer,
  liveStream:liveStreamReducer,
});

export default rootReducer;