const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

function pad(value) {
  return String(value).padStart(2, "0");
}

export function getTaskWorkedMs(task, now = Date.now()) {
  const baseMs = (task.actualTime || 0) * MINUTE_MS;

  if (task.status !== "in-progress" || !task.startedAt) {
    return baseMs;
  }

  const startedAtMs = new Date(task.startedAt).getTime();

  if (Number.isNaN(startedAtMs)) {
    return baseMs;
  }

  return baseMs + Math.max(0, now - startedAtMs);
}

export function formatRunningTime(totalMs) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / SECOND_MS));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatLoggedTime(minutes = 0) {
  if (!minutes) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
}
