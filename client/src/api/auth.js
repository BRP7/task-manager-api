import api from "./client";

export const loginUser = (payload) => api.post("/auth/login", payload);

export const registerUser = (payload) => api.post("/auth/register", payload);

export const fetchProfile = () => api.get("/users/profile");

export const logoutUser = () => api.post("/auth/logout");

export const refreshToken = (refreshToken) => api.post("/auth/refresh", { refreshToken });