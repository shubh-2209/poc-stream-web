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

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.greeting}>
          👋 Welcome, {user?.fullName || "User"}!
        </h1>

        <p className={styles.email}>📧 {user?.email}</p>
        <p className={styles.id}>🆔 User ID: {user?.id}</p>

        <button
          onClick={handleLogout}
          disabled={loading}
          className={styles.logoutBtn}
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
