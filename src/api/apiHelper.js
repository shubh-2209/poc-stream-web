import axios from "axios";
import { store } from "../redux/store";
import { logout as logoutAction } from "../features/auth/authSlice";
 
const BASE_URL = "https://jamila-coky-closer.ngrok-free.dev/api";
// const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333/api";
 
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
 
axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state?.auth?.token ?? null;
 
    config.headers = config.headers || {};
 
    config.headers["ngrok-skip-browser-warning"] = "true"; 
 
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
 
    const isFormData = config.data instanceof FormData;
 
    if (!isFormData && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    if (isFormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
 
    return config;
  },
  (error) => Promise.reject(error)
);
 
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        store.dispatch(logoutAction());
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: async (endpoint, config = {}) => {
    const res = await axiosInstance.get(endpoint, config);
    return res.data;
  },
  post: async (endpoint, data, config = {}) => {
    const res = await axiosInstance.post(endpoint, data, config);
    return res.data;
  },
  put: async (endpoint, data, config = {}) => {
    const res = await axiosInstance.put(endpoint, data, config);
    return res.data;
  },
  delete: async (endpoint, config = {}) => {
    const res = await axiosInstance.delete(endpoint, config);
    return res.data ?? {};
  },
};