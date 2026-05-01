import axios from "axios";

export const TOKEN_KEY = "task-orbit-token";
export const REFRESH_TOKEN_KEY = "task-orbit-refresh-token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

export default api;
