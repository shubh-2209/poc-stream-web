import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "../features/auth/AuthPage";
import PrivateRoute from "../features/auth/PrivateRoute";
import Dashboard from "../pages/Dashboard";
import VideoUploadPage from "../pages/VideoUploadPage";
import LiveStreamingPage from "../pages/LiveStreamingPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<VideoUploadPage />} />
          <Route path="/live" element={<LiveStreamingPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
