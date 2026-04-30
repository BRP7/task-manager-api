import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";
import CarryForwardModal from "../components/CarryForwardModal";
import LoadingScreen from "../components/LoadingScreen";
import TaskModal from "../components/TaskModal";
import { useAuth } from "../context/AuthContext";

const emptyTasks = {
  primary: null,
  secondary: []
};

function getTaskStatusLabel(status) {
  if (status === "in-progress") {
    return "In progress";
  }

  if (status === "todo") {
    return "To do";
  }

  return "Done";
}

function getSecondaryAction(task) {
  if (task.status === "todo") {
    return { label: "Start", nextStatus: "in-progress" };
  }

  if (task.status === "in-progress") {
    return { label: "Done", nextStatus: "done" };
  }

  return { label: "Reopen", nextStatus: "todo" };
}

function SecondaryTaskRow({ isSubmitting, onDelete, onRename, onStatusChange, task }) {
  const [isEditing, setIsEditing] = useState(false);
  const [renameValue, setRenameValue] = useState(task.title);

  useEffect(() => {
    setRenameValue(task.title);
  }, [task.title]);

  const action = getSecondaryAction(task);
  const renameDisabled = task.status === "done";

  const submitRename = async (event) => {
    event.preventDefault();
    const renamed = await onRename(task._id, renameValue.trim());

    if (renamed) {
      setIsEditing(false);
    }
  };

  return (
    <li className="secondary-row">
      <div className="secondary-main">
        <div>
          <p className="secondary-title">{task.title}</p>
          <p className="secondary-meta">{task.estimatedTime} min</p>
        </div>
        <span className={`status-pill status-${task.status}`}>{getTaskStatusLabel(task.status)}</span>
      </div>

      {isEditing ? (
        <form className="compact-rename" onSubmit={submitRename}>
          <input
            disabled={renameDisabled || isSubmitting}
            onChange={(event) => setRenameValue(event.target.value)}
            value={renameValue}
          />
          <button
            className="ghost-button small-button"
            disabled={
              renameDisabled ||
              isSubmitting ||
              !renameValue.trim() ||
              renameValue.trim() === task.title
            }
            type="submit"
          >
            Save
          </button>
          <button
            className="inline-button"
            disabled={isSubmitting}
            onClick={() => {
              setIsEditing(false);
              setRenameValue(task.title);
            }}
            type="button"
          >
            Cancel
          </button>
        </form>
      ) : null}

      <div className="secondary-actions">
        <button
          className="ghost-button small-button"
          disabled={isSubmitting}
          onClick={() => onStatusChange(task._id, action.nextStatus)}
          type="button"
        >
          {action.label}
        </button>

        <button
          className="inline-button"
          disabled={renameDisabled || isSubmitting}
          onClick={() => setIsEditing(true)}
          type="button"
        >
          Rename
        </button>

        <button
          className="inline-button danger-link"
          disabled={isSubmitting}
          onClick={() => onDelete(task._id)}
          type="button"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const { signOut } = useAuth();
  const [tasks, setTasks] = useState(emptyTasks);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [taskModalNotice, setTaskModalNotice] = useState(null);
  const [carryNotice, setCarryNotice] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCarryModalOpen, setIsCarryModalOpen] = useState(false);
  const [showSecondaryTasks, setShowSecondaryTasks] = useState(false);
  const [isPrimaryRenaming, setIsPrimaryRenaming] = useState(false);
  const [primaryRenameValue, setPrimaryRenameValue] = useState("");

  const handleUnauthorized = () => {
    signOut();
  };

  const loadTasks = async () => {
    try {
      const response = await api.get("/tasks");
      const nextTasks = {
        primary: response.data.primary,
        secondary: response.data.secondary || []
      };

      setTasks(nextTasks);
      setPrimaryRenameValue(nextTasks.primary?.title || "");
      setSelectedIds((current) => {
        const carryableIds = new Set(
          [nextTasks.primary, ...nextTasks.secondary]
            .filter(Boolean)
            .filter((task) => task.status !== "done")
            .map((task) => task._id)
        );

        return current.filter((id) => carryableIds.has(id));
      });
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setNotice({
        type: "error",
        text: getErrorMessage(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const runMutation = async ({ onSuccess, request, successMessage }) => {
    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await request();

      setNotice({
        type: "success",
        text: response.data?.message || successMessage
      });

      await loadTasks();

      if (onSuccess) {
        onSuccess(response);
      }

      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return false;
      }

      setNotice({
        type: "error",
        text: getErrorMessage(error)
      });

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async (payload) => {
    setIsSubmitting(true);
    setTaskModalNotice(null);

    try {
      const response = await api.post("/tasks", payload);

      setNotice({
        type: "success",
        text: response.data?.message || "Task created successfully"
      });
      setIsTaskModalOpen(false);
      setTaskModalNotice(null);
      await loadTasks();
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return false;
      }

      setTaskModalNotice({
        type: "error",
        text: getErrorMessage(error)
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (taskId, status) =>
    runMutation({
      request: () => api.patch(`/tasks/${taskId}/status`, { status }),
      successMessage: "Task status updated"
    });

  const handleRenameTask = (taskId, renameValue) =>
    runMutation({
      request: () => api.patch(`/tasks/${taskId}/rename`, { rename: renameValue.trim() }),
      successMessage: "Task renamed successfully"
    });

  const handleDeleteTask = (taskId) =>
    runMutation({
      request: () => api.delete(`/tasks/${taskId}`),
      successMessage: "Task deleted successfully"
    });

  const handleCarryForward = async ({ ids, successMessage }) => {
    setIsSubmitting(true);
    setCarryNotice(null);

    try {
      const response = await api.post("/tasks/carry-forward", ids ? { ids } : {});

      setNotice({
        type: "success",
        text: response.data?.message || successMessage
      });
      setCarryNotice(null);
      setSelectedIds([]);
      setIsCarryModalOpen(false);
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return false;
      }

      setCarryNotice({
        type: "error",
        text: getErrorMessage(error)
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTaskModal = () => {
    setNotice(null);
    setTaskModalNotice(null);
    setIsTaskModalOpen(true);
  };

  const openCarryModal = () => {
    setNotice(null);
    setCarryNotice(null);
    setSelectedIds([]);
    setIsCarryModalOpen(true);
  };

  const toggleSelectedTask = (taskId) => {
    setSelectedIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
    );
  };

  const submitPrimaryRename = async (event) => {
    event.preventDefault();

    if (!tasks.primary) {
      return;
    }

    const renamed = await handleRenameTask(tasks.primary._id, primaryRenameValue);

    if (renamed) {
      setIsPrimaryRenaming(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen label="Loading today's tasks..." />;
  }

  const primaryTask = tasks.primary;
  const unfinishedSecondaryCount = tasks.secondary.filter((task) => task.status !== "done").length;
  const carryableTasks = [tasks.primary, ...tasks.secondary].filter(
    (task) => task && task.status !== "done"
  );

  let primaryActionLabel = null;
  let primaryActionStatus = null;

  if (primaryTask?.status === "todo") {
    primaryActionLabel = "Start";
    primaryActionStatus = "in-progress";
  }

  if (primaryTask?.status === "in-progress") {
    primaryActionLabel = "Mark Done";
    primaryActionStatus = "done";
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-toolbar">
          <div className="dashboard-brand">
            <p className="eyebrow">Task Orbit</p>
          </div>

          <div className="dashboard-actions">
            <button className="ghost-button toolbar-action" onClick={openTaskModal} type="button">
              + Add Task
            </button>
            <button
              className="ghost-button toolbar-action"
              disabled={carryableTasks.length === 0}
              onClick={openCarryModal}
              type="button"
            >
              Carry Forward
            </button>
            <button className="inline-button toolbar-logout" onClick={signOut} type="button">
              Logout
            </button>
          </div>
        </header>

        {notice ? (
          <p className={`notice ${notice.type === "error" ? "notice-error" : "notice-success"}`}>
            {notice.text}
          </p>
        ) : null}

        <section className="panel primary-focus-card">
          <p className="eyebrow">Main Task</p>

          {primaryTask ? (
            <>
              <h3 className="primary-title">{primaryTask.title}</h3>
              <p className="primary-time">{primaryTask.estimatedTime} min</p>
              <p className="primary-status-line">Status: {getTaskStatusLabel(primaryTask.status)}</p>

              {isPrimaryRenaming ? (
                <form className="compact-rename" onSubmit={submitPrimaryRename}>
                  <input
                    disabled={primaryTask.status === "done" || isSubmitting}
                    onChange={(event) => setPrimaryRenameValue(event.target.value)}
                    value={primaryRenameValue}
                  />
                  <button
                    className="ghost-button small-button"
                    disabled={
                      primaryTask.status === "done" ||
                      isSubmitting ||
                      !primaryRenameValue.trim() ||
                      primaryRenameValue.trim() === primaryTask.title
                    }
                    type="submit"
                  >
                    Save
                  </button>
                  <button
                    className="inline-button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsPrimaryRenaming(false);
                      setPrimaryRenameValue(primaryTask.title);
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </form>
              ) : null}

              <div className="primary-actions">
                {primaryActionLabel ? (
                  <button
                    className="primary-button"
                    disabled={isSubmitting}
                    onClick={() => handleStatusChange(primaryTask._id, primaryActionStatus)}
                    type="button"
                  >
                    {primaryActionLabel}
                  </button>
                ) : (
                  <div className="quiet-complete">Main task complete.</div>
                )}

                <button
                  className="ghost-button"
                  disabled={primaryTask.status === "done" || isSubmitting}
                  onClick={() => setIsPrimaryRenaming(true)}
                  type="button"
                >
                  Rename
                </button>

                {primaryTask.status !== "todo" ? (
                  <button
                    className="inline-button"
                    disabled={isSubmitting}
                    onClick={() => handleStatusChange(primaryTask._id, "todo")}
                    type="button"
                  >
                    Reopen
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="empty-primary">
              <h3>No main task yet</h3>
              <p>Start by adding the one task that should guide the rest of the day.</p>
              <button className="primary-button" onClick={openTaskModal} type="button">
                + Add Task
              </button>
            </div>
          )}
        </section>

        <section className="panel secondary-panel">
          <button
            className="secondary-toggle"
            onClick={() => setShowSecondaryTasks((current) => !current)}
            type="button"
          >
            <span>Secondary Tasks ({tasks.secondary.length})</span>
            <span aria-hidden="true">{showSecondaryTasks ? "^" : "v"}</span>
          </button>

          {showSecondaryTasks ? (
            tasks.secondary.length ? (
              <ul className="secondary-list">
                {tasks.secondary.map((task) => (
                  <SecondaryTaskRow
                    key={task._id}
                    isSubmitting={isSubmitting}
                    onDelete={handleDeleteTask}
                    onRename={handleRenameTask}
                    onStatusChange={handleStatusChange}
                    task={task}
                  />
                ))}
              </ul>
            ) : (
              <p className="muted-copy">No secondary tasks yet.</p>
            )
          ) : (
            <p className="muted-copy">
              {unfinishedSecondaryCount > 0
                ? `${unfinishedSecondaryCount} unfinished secondary task${
                    unfinishedSecondaryCount === 1 ? "" : "s"
                  } ready when the main task is handled.`
                : "Keep the rest hidden until you need it."}
            </p>
          )}
        </section>
      </div>

      <TaskModal
        feedback={taskModalNotice}
        hasPrimaryTask={Boolean(primaryTask)}
        isOpen={isTaskModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
      />

      <CarryForwardModal
        feedback={carryNotice}
        isOpen={isCarryModalOpen}
        isSubmitting={isSubmitting}
        onCarryAll={() =>
          handleCarryForward({
            successMessage: "Tasks carried forward successfully"
          })
        }
        onCarrySelected={() =>
          handleCarryForward({
            ids: selectedIds,
            successMessage: "Selected tasks carried forward successfully"
          })
        }
        onClose={() => setIsCarryModalOpen(false)}
        onToggleSelect={toggleSelectedTask}
        selectedIds={selectedIds}
        tasks={carryableTasks}
      />
    </main>
  );
}
