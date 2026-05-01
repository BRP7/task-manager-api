import api from "./client";

export const fetchTodayTasks = () => api.get("/tasks");

export const fetchTaskHistory = () => api.get("/tasks/history");

export const createTask = (payload) => api.post("/tasks", payload);

export const updateTaskStatus = (taskId, status) =>
  api.patch(`/tasks/${taskId}/status`, { status });

export const renameTask = (taskId, rename) =>
  api.patch(`/tasks/${taskId}/rename`, { rename });

export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);

export const carryForwardTasks = (ids) => api.post("/tasks/carry-forward", { ids });
