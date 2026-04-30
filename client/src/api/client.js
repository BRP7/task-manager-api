import axios from "axios";

export const TOKEN_KEY = "task-orbit-token";

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

export const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong";

export default api;
