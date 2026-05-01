import axios from "axios";
import { refreshToken } from "./auth";

export const TOKEN_KEY = "task-orbit-token";
export const REFRESH_TOKEN_KEY = "task-orbit-refresh-token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api"
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// TOKEN STORAGE
export const setAuthTokens = ({ refreshToken, token }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const clearAuthTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong";

// ===== RESPONSE INTERCEPTOR =====

let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) {
      clearAuthTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const res = await refreshToken(storedRefreshToken);
      const newAccessToken = res.data.accessToken;

      localStorage.setItem(TOKEN_KEY, newAccessToken);
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);

    } catch (err) {
      processQueue(err, null);
      clearAuthTokens();
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;