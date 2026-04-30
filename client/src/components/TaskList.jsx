import { useEffect, useState } from "react";

const statusOptions = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" }
];

function TaskCard({ task, isPrimary, isSelected, isSubmitting, onDelete, onRename, onStatusChange, onToggleSelect }) {
  const [renameValue, setRenameValue] = useState(task.title);

  useEffect(() => {
    setRenameValue(task.title);
  }, [task.title]);

  const isDone = task.status === "done";
  const canRename = !isDone;

  const submitRename = async (event) => {
    event.preventDefault();
    await onRename(task._id, renameValue);
  };

  return (
    <article className={`task-card ${isPrimary ? "task-card-primary" : ""} ${isDone ? "task-card-done" : ""}`}>
      <div className="task-card-header">
        <label className="task-select">
          <input
            checked={isSelected}
            disabled={isDone || isSubmitting}
            onChange={() => onToggleSelect(task._id)}
            type="checkbox"
          />
          <span>{isDone ? "Completed" : "Select"}</span>
        </label>

        <span className={`status-pill status-${task.status}`}>{task.status.replace("-", " ")}</span>
      </div>

      <div className="task-meta">
        <div>
          <p className="task-type">{isPrimary ? "Primary task" : "Secondary task"}</p>
          <h3>{task.title}</h3>
        </div>
        <p className="task-time">
          Est. {task.estimatedTime} min
          <span>Actual {task.actualTime} min</span>
        </p>
      </div>

      <form className="rename-form" onSubmit={submitRename}>
        <input
          disabled={!canRename || isSubmitting}
          onChange={(event) => setRenameValue(event.target.value)}
          value={renameValue}
        />
        <button
          className="ghost-button"
          disabled={
            !canRename ||
            isSubmitting ||
            !renameValue.trim() ||
            renameValue.trim() === task.title
          }
          type="submit"
        >
          Rename
        </button>
      </form>

      <div className="task-actions">
        <label className="status-picker">
          <span>Status</span>
          <select
            disabled={isSubmitting}
            onChange={(event) => onStatusChange(task._id, event.target.value)}
            value={task.status}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {!isPrimary ? (
          <button
            className="danger-button"
            disabled={isSubmitting}
            onClick={() => onDelete(task._id)}
            type="button"
          >
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function TaskList({
  primaryTask,
  secondaryTasks,
  selectedIds,
  isSubmitting,
  onDelete,
  onRename,
  onStatusChange,
  onToggleSelect
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Today's Tasks</p>
          <h2>Keep the primary task in focus, then move through the supporting list</h2>
        </div>
      </div>

      <div className="task-section">
        <div className="task-group-heading">
          <h3>Primary</h3>
          <p>Only one primary task can exist each day.</p>
        </div>

        {primaryTask ? (
          <TaskCard
            isPrimary
            isSelected={selectedIds.includes(primaryTask._id)}
            isSubmitting={isSubmitting}
            onDelete={onDelete}
            onRename={onRename}
            onStatusChange={onStatusChange}
            onToggleSelect={onToggleSelect}
            task={primaryTask}
          />
        ) : (
          <div className="empty-state">
            <p>No primary task yet. Create one to unlock the rest of today's plan.</p>
          </div>
        )}
      </div>

      <div className="task-section">
        <div className="task-group-heading">
          <h3>Secondary</h3>
          <p>Secondary tasks can be renamed, updated, and deleted.</p>
        </div>

        {secondaryTasks.length ? (
          <div className="task-list">
            {secondaryTasks.map((task) => (
              <TaskCard
                key={task._id}
                isPrimary={false}
                isSelected={selectedIds.includes(task._id)}
                isSubmitting={isSubmitting}
                onDelete={onDelete}
                onRename={onRename}
                onStatusChange={onStatusChange}
                onToggleSelect={onToggleSelect}
                task={task}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No secondary tasks yet. Add a few once the main goal is defined.</p>
          </div>
        )}
      </div>
    </section>
  );
}
