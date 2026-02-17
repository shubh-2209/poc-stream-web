import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  logoutUser,
  selectUser,
  selectAuthLoading,
} from "../features/auth/authSlice";
import styles from "../features/auth/authPage.module.css";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/auth", { replace: true });
  };

  const handleUploadRedirect = () => {
    navigate("/upload");
  };

  const handleLiveRedirect = () => {
    navigate("/live");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.greeting}>
          👋 Welcome, {user?.fullName || "User"}!
        </h1>

        <p className={styles.email}>📧 {user?.email}</p>
        <p className={styles.id}>🆔 User ID: {user?.id}</p>

        <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={handleUploadRedirect}
            className={styles.logoutBtn}
          >
            📤 Upload Video
          </button>

          <button
            onClick={handleLiveRedirect}
            className={styles.logoutBtn}
          >
            🔴 Go Live
          </button>
        </div>

        <button
          onClick={handleLogout}
          disabled={loading}
          className={styles.logoutBtn}
          style={{ marginTop: "20px", backgroundColor: "#ff4d4f" }}
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
