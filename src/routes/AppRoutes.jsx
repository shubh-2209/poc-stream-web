import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "../pages/AuthPage";
import PrivateRoute from "../features/auth/PrivateRoute.jsx";
import Dashboard from "../pages/Dashboard";
import VideoUploadPage from "../pages/VideoUploadPage";
import Upload from "../pages/Upload";
import Profile from "../pages/Profile";
import LiveStream from "../pages/LiveStream";
import MainLayout from "../layouts/MainLayout.jsx";
import DashboardVideosPage from "../pages/DashboardVideosPage.jsx";
import VideoUploadFilterPage from "../pages/VideoPreviewFilters.jsx";


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/videos" element={<DashboardVideosPage />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/uploadVideo" element={<VideoUploadPage />} />
            <Route
              path="/uploadVideoFilter"
              element={<VideoUploadFilterPage />}
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/liveStream" element={<LiveStream />} />

          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
