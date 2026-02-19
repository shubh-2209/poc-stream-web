import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "../features/auth/authSlice";
import { api } from "../api/apiHelper";
import Navbar from "../components/Navbar";
import styles from '../styles/Profile/Profile.module.css';

const Profile = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalDuration: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate("/dashboard")
    }
  }

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await api.get("/videos");
        const videos = response.videos || response.data || [];

        console.log("Videos data:", videos);
        console.log("Durations:", videos.map(v => ({ title: v.title, duration: v.duration })));

        const totalDuration = videos.reduce((sum, v) => {
          const duration = parseFloat(v.duration) || 0;
          return sum + duration;
        }, 0);

        setStats({
          totalVideos: videos.length,
          totalViews: videos.reduce((sum, v) => sum + (v.views || 0), 0),
          totalDuration: totalDuration,
        });

        console.log("Total Duration:", totalDuration);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "0m";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className={styles.profilePage}>
      <Navbar />

      <div className={styles.container}>
        <button
          className={styles.backBtn}
          onClick={handleBack}
        >
          ← Back
        </button>

        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarLarge}>
              {user?.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
            <h1 className={styles.userName}>{user?.fullName || "User"}</h1>
            <p className={styles.userEmail}>{user?.email || "N/A"}</p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📹</div>
              <div className={styles.statValue}>
                {loading ? "..." : stats.totalVideos}
              </div>
              <div className={styles.statLabel}>Videos Uploaded</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>👁️</div>
              <div className={styles.statValue}>
                {loading ? "..." : stats.totalViews}
              </div>
              <div className={styles.statLabel}>Total Views</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>⏱️</div>
              <div className={styles.statValue}>
                {loading ? "..." : formatDuration(stats.totalDuration)}
              </div>
              <div className={styles.statLabel}>Total Duration</div>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <h2 className={styles.sectionTitle}>Profile Details</h2>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Full Name:</span>
              <span className={styles.detailValue}>{user?.fullName || "N/A"}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email:</span>
              <span className={styles.detailValue}>{user?.email || "N/A"}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>User ID:</span>
              <span className={styles.detailValue}>{user?.id || "N/A"}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.primaryBtn}
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={() => navigate("/upload")}
            >
              Upload New Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
