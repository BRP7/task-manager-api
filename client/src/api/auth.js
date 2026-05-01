import api from "./client";

export const loginUser = (payload) => api.post("/users/login", payload);

export const registerUser = (payload) => api.post("/users/register", payload);

export const fetchProfile = () => api.get("/users/profile");

export const logoutUser = () => api.post("/auth/logout");
