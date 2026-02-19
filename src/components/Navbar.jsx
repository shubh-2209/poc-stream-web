import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutUser, selectUser, selectAuthLoading } from "../features/auth/authSlice";
import styles from "../styles/Dashboard/Navbar.module.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Determine active toggle based on current route
  const isVideosTab = location.pathname === "/videos";
  const isReelsTab = location.pathname === "/dashboard";

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/auth", { replace: true });
  };

  const handleToggle = (tab) => {
    if (tab === "reels") navigate("/dashboard");
    else navigate("/videos");
  };

  const handleProfileClick = () => {
    // setShowProfileDropdown((prev) => !prev);
    navigate("/profile");
  };

  const handleLiveRedirect = () => {
    navigate("/liveStream");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>

        {/* Brand */}
        <div className={styles.brand}>
          <h2
            onClick={() => navigate("/dashboard")}
            className={styles.logoName}
          >
            POC Dashboard
          </h2>
        </div>
        <div className="up_btn">
          <button
            className={styles.uploadBtn}
            onClick={() => navigate("/uploadVideoFilter")}
          >
            Filter Video
          </button>
        </div>
        {/* Reel / Video Toggle */}
        <div className={styles.toggleWrapper}>
          <button
            className={`${styles.toggleBtn} ${isReelsTab ? styles.toggleActive : ""}`}
            onClick={() => handleToggle("reels")}
          >
            🎬 Reels
          </button>
          <button
            className={`${styles.toggleBtn} ${isVideosTab ? styles.toggleActive : ""}`}
            onClick={() => handleToggle("videos")}
          >
            📹 Videos
          </button>
        </div>

        {/* Right actions */}
        <div className={styles.userSection}>
          <button onClick={handleLiveRedirect} className={styles.liveBtn}>
            🔴 Go Live
          </button>

          {/* Avatar with dropdown */}
          <div className={styles.avatarWrapper}>
            <div
              className={styles.avatar}
              onClick={handleProfileClick}
              title={user?.fullName || "Profile"}
            >
              {user?.fullName?.charAt(0).toUpperCase() || "U"}
            </div>

            {showProfileDropdown && (
              <div className={styles.profileDropdown}>
                <h4>Profile Details</h4>
                <p>
                  <span className={styles.label}>Name:</span>{" "}
                  {user?.fullName || "User"}
                </p>
                <p>
                  <span className={styles.label}>Email:</span>{" "}
                  {user?.email || "N/A"}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={loading}
            className={styles.logoutBtn}
          >
            {loading ? "..." : "Logout"}
          </button>

        </div>
      </div>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await dispatch(logoutUser());
                  navigate("/auth", { replace: true });
                }}
                className={styles.confirmBtn}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;  