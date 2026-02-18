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
} from "../features/auth/authSlice";

import styles from "../styles/Auth/AuthPage.module.css";

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
  const [localErrors, setLocalErrors] = useState({});

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
      const passwordErrors = [];

      if (formData.password.length < 8) {
        passwordErrors.push("at least 8 characters");
      }
      if (formData.password.length > 50) {
        passwordErrors.push("maximum 50 characters");
      }
      if (!/(?=.*[a-z])/.test(formData.password)) {
        passwordErrors.push("one lowercase letter");
      }
      if (!/(?=.*[A-Z])/.test(formData.password)) {
        passwordErrors.push("one uppercase letter");
      }
      if (!/(?=.*\d)/.test(formData.password)) {
        passwordErrors.push("one number");
      }

      if (passwordErrors.length > 0) {
        errors.password = `Password must contain: ${passwordErrors.join(", ")}`;
      }
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
                maxLength="50"
                autoComplete="name"
              />
              {localErrors.fullName && (
                <span className={styles.fieldError}>{localErrors.fullName}</span>
              )}
            </div>
          )}

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
              maxLength="100"
              autoComplete="email"
            />
            {localErrors.email && (
              <span className={styles.fieldError}>{localErrors.email}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
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
