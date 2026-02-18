import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "../pages/AuthPage";
import PrivateRoute from "../features/auth/PrivateRoute";
import Dashboard from "../pages/Dashboard";
import VideoUploadPage from "../pages/VideoUploadPage";
import LiveStreamingPage from "../pages/LiveStreamingPage";
import Upload from "../pages/Upload";
import Profile from "../pages/Profile";
import LiveStream from "../components/LiveStream";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/uploadVideo" element={<VideoUploadPage />} />
          <Route path="/live" element={<LiveStreamingPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/liveStream" element={<LiveStream />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
