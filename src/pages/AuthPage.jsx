import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  loginUser,
  registerUser,
  clearError,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from "../features/auth/authSlice";
import styles from "../styles/Auth/AuthPage.module.css";

// ── Validation ────────────────────────────────────────────────

const validate = (formData, isLogin) => {
  const errors = {};

  if (!isLogin) {
    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = "Full name must be at least 3 characters";
    } else if (formData.fullName.trim().length > 50) {
      errors.fullName = "Full name must not exceed 50 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      errors.fullName = "Full name can only contain letters and spaces";
    }
  }

  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  } else if (formData.email.length > 100) {
    errors.email = "Email must not exceed 100 characters";
  }

  if (!formData.password) {
    errors.password = "Password is required";
  } else if (!isLogin) {
    const missing = [];
    if (formData.password.length < 8) missing.push("at least 8 characters");
    if (formData.password.length > 50) missing.push("maximum 50 characters");
    if (!/(?=.*[a-z])/.test(formData.password)) missing.push("one lowercase letter");
    if (!/(?=.*[A-Z])/.test(formData.password)) missing.push("one uppercase letter");
    if (!/(?=.*\d)/.test(formData.password)) missing.push("one number");
    if (missing.length > 0)
      errors.password = `Password must contain: ${missing.join(", ")}`;
  }

  return errors;
};

// ── Component ─────────────────────────────────────────────────

const EMPTY_FORM = { fullName: "", email: "", password: "" };

const AuthPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [localErrors, setLocalErrors] = useState({});

  // Already logged in → dashboard
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  // Redux error → toast (email already taken, wrong password, etc.)
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleToggleMode = () => {
    setIsLogin((prev) => !prev);
    setFormData(EMPTY_FORM);
    setLocalErrors({});
    dispatch(clearError());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localErrors[name]) setLocalErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    const errors = validate(formData, isLogin);
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    setLocalErrors({});

    if (isLogin) {
      // ── Login ───────────────────────────────────────────────
      const result = await dispatch(
        loginUser({ email: formData.email.trim(), password: formData.password })
      );
      if (loginUser.fulfilled.match(result)) {
        toast.success("Login successful! Welcome back 👋");
        navigate("/dashboard", { replace: true });
      }
    } else {
      // ── Register ────────────────────────────────────────────
      const result = await dispatch(
        registerUser({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        })
      );
      if (registerUser.fulfilled.match(result)) {
        toast.success("Account created! Please login to continue 🎉");
        setFormData(EMPTY_FORM);
        setTimeout(() => setIsLogin(true), 800);
        setIsLogin(true);
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

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="fullName" className={styles.label}>Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                className={`${styles.input} ${localErrors.fullName ? styles.inputError : ""}`}
                disabled={loading}
                maxLength="50"
                autoComplete="name"
              />
              {localErrors.fullName && (
                <span className={styles.fieldError}>{localErrors.fullName}</span>
              )}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${localErrors.email ? styles.inputError : ""}`}
              disabled={loading}
              maxLength="100"
              autoComplete="email"
            />
            {localErrors.email && (
              <span className={styles.fieldError}>{localErrors.email}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder={isLogin ? "Enter your password" : "Min 8 chars, 1 uppercase, 1 lowercase, 1 number"}
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${localErrors.password ? styles.inputError : ""}`}
              disabled={loading}
              maxLength={isLogin ? "100" : "50"}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            {localErrors.password && (
              <span className={styles.fieldError}>{localErrors.password}</span>
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : isLogin ? "Login" : "Register"}
          </button>
        </form>

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