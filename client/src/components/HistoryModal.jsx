import React from "react";
import { formatLoggedTime } from "../utils/taskTime";

export default function HistoryModal({
  isOpen,
  onClose,
  historyGroups,
  isLoading,
  onRetry,
  feedback
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Task History</p>
            <h2>Your last 7 days activity</h2>
          </div>
          <button className="inline-button" onClick={onClose}>
            Close
          </button>
        </div>

        {feedback ? (
          <p className={`notice ${feedback.type === "error" ? "notice-error" : "notice-success"}`}>
            {feedback.text}
          </p>
        ) : null}

        {isLoading ? (
          <p>Loading history...</p>
        ) : historyGroups.length === 0 ? (
          <div className="empty-history">
            <p>No history found.</p>
            <button className="ghost-button" onClick={onRetry}>
              Retry
            </button>
          </div>
        ) : (
          <div className="history-list">
            {historyGroups.map((group) => {
              const totalTime = group.tasks.reduce(
                (sum, task) => sum + (task.actualTime || 0),
                0
              );

              const completedCount = group.tasks.filter(
                (t) => t.status === "done"
              ).length;

              return (
                <div key={group.date} className="history-group">
                  <h4>{group.label}</h4>

                  <p className="history-summary">
  <span>{group.tasks.length} tasks</span>
  <span>Completed {completedCount}</span>
  <span className="worked-time">{formatLoggedTime(totalTime)}</span>
</p>

                  {group.tasks.map((task) => (
<div key={task._id} className="history-task-card">
                        <p className="history-title">{task.title}</p>

                      <p className="history-meta">
                        {task.type} • {formatStatus(task.status)} • Planned{" "}
                        {task.estimatedTime} min •{" "}
                        {task.actualTime > 0
                          ? `Worked ${formatLoggedTime(task.actualTime)}`
                          : task.status === "done"
                          ? "Completed without tracking"
                          : "Not worked"}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatStatus(status) {
  if (status === "todo") return "To do";
  if (status === "in-progress") return "In progress";
  return "Done";
}