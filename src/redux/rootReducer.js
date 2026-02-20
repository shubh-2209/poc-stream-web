import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import videoThumbnailReducer from "../features/videoThumbnail/videoThumbnailSlice"
import videosReducer from "../features/videos/videosSlice";
import liveStreamReducer from "../features/liveStream/liveStreamSlice";
import videoConvertReducer from "../features/videoConvert/videoConvertSlice";
import chatReducer from "../features/chat/chatSlice";


const rootReducer = combineReducers({
  auth: authReducer,
  videoThumbnail: videoThumbnailReducer,
  videos: videosReducer,
  liveStream: liveStreamReducer,
  videoConvert: videoConvertReducer,
  chat: chatReducer,
});

export default rootReducer;
