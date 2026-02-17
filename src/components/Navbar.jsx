import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser, selectUser, selectAuthLoading } from "../features/auth/authSlice";
import styles from "./Navbar.module.css";
// import styles from "../assets/mycss.css"; 
// import styles from "mycss.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/auth", { replace: true });
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  
  const handleUploadRedirect = () => {
    navigate("/upload");
  };

  const handleLiveRedirect = () => {
    navigate("/live");
  };

  return (



    
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <h2>POC Dashboard</h2>
        </div>

        <div className={styles.userSection}>


          <div className="pr_5"> 
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
            <ul>

            <li> <div className={styles.avatar} onClick={toggleProfileDropdown}>
              {user?.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
 </li>
            <li> <button
            onClick={handleLogout}
            disabled={loading}
            className={styles.logoutBtn}
          >
            {loading ? "..." : "Logout"}
          </button>
 </li>

            </ul>

          <div className="right_div">
            
            {showProfileDropdown && (
              <div className={styles.profileDropdown}>
                <h4>Profile Details</h4>
                <p><span className={styles.label}>Name:</span> {user?.fullName || "User"}</p>
                <p><span className={styles.label}>Email:</span> {user?.email || "N/A"}</p>
              </div>
            )}
          </div>

          
              </div>


        </div>
      </div>
    </nav>
  );
};

export default Navbar;
