import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  loginUser,
  registerUser,
  clearError,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from "./authSlice";
import styles from "./AuthPage.module.css";

const AuthPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [localErrors, setLocalErrors] = useState({});  // custom validation errors

  // Already logged in → dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleToggleMode = () => {
    setIsLogin((prev) => !prev);
    setFormData({ fullName: "", email: "", password: "" });
    setSuccessMsg("");
    setLocalErrors({});
    dispatch(clearError());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
     if (localErrors[name]) {
      setLocalErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

   const validate = () => {
    const errors = {};

    if (!isLogin && !formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (!isLogin && formData.fullName.trim().length < 3) {
      errors.fullName = "Full name must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } 
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    dispatch(clearError());

     const errors = validate();
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    setLocalErrors({});

    if (isLogin) {
      // ── LOGIN ──
      const result = await dispatch(
        loginUser({
          email: formData.email.trim(),
          password: formData.password,
        })
      );
      if (loginUser.fulfilled.match(result)) {
        navigate("/dashboard", { replace: true });
      }
    } else {
      // ── REGISTER ──
      const result = await dispatch(
        registerUser({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        })
      );
      if (registerUser.fulfilled.match(result)) {
        // setSuccessMsg("Registration successful! Please login.");
        navigate("/dashboard", { replace: true });
        // setFormData({ fullName: "", email: "", password: "" });
        // setTimeout(() => {
        //   setIsLogin(true);
        //   setSuccessMsg("");
        // }, 1500);
      }
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
         <div className={styles.header}>
          <h1 className={styles.title}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className={styles.subtitle}>
            {isLogin ? "Login to continue" : "Register to get started"}
          </p>
        </div>

         {error && <div className={styles.errorMsg}>{error}</div>}

         {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
           {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="fullName" className={styles.label}>
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                className={`${styles.input} ${localErrors.fullName ? styles.inputError : ""}`}
                disabled={loading}
              />
              {localErrors.fullName && (
                <span className={styles.fieldError}>{localErrors.fullName}</span>
              )}
            </div>
          )}

          {/* Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${localErrors.email ? styles.inputError : ""}`}
              disabled={loading}
            />
            {localErrors.email && (
              <span className={styles.fieldError}>{localErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password (min 8 chars)"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${localErrors.password ? styles.inputError : ""}`}
              disabled={loading}
            />
            {localErrors.password && (
              <span className={styles.fieldError}>{localErrors.password}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : isLogin ? (
              "Login"
            ) : (
              "Register"
            )}
          </button>
        </form>

        {/* Toggle login/register */}
        <p className={styles.toggleText}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={handleToggleMode}
            className={styles.toggleBtn}
            disabled={loading}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;