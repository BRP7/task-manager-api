import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";
import { getErrorMessage } from "../api/client";
import {
  // carryForwardTasks,
  createTask,
  deleteTask,
  fetchTaskHistory,
  fetchTodayTasks,
  renameTask,
  updateTaskStatus
} from "../api/tasks";
// import CarryForwardModal from "../components/CarryForwardModal";
import HistoryModal from "../components/HistoryModal";
import LoadingScreen from "../components/LoadingScreen";
import TaskModal from "../components/TaskModal";
import { useAuth } from "../context/AuthContext";
import { groupTasksByDate } from "../utils/taskHistory";
import { formatLoggedTime, formatRunningTime, getTaskWorkedMs } from "../utils/taskTime";

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

function TaskTimeSummary({ now, task }) {
  const isRunning = task.status === "in-progress" && Boolean(task.startedAt);

  return (
    <div className="task-time-stack">
      <p className="task-estimate">Estimated {task.estimatedTime} min</p>
      <p className="task-worked">Worked {formatLoggedTime(task.actualTime)}</p>
      {isRunning ? (
        <p className="task-running">Running {formatRunningTime(getTaskWorkedMs(task, now))}</p>
      ) : null}
    </div>
  );
}

function SecondaryTaskRow({
  isSubmitting,
  now,
  onDelete,
  onRename,
  onStatusChange,
  task
}) {
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
          <TaskTimeSummary now={now} task={task} />
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
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [tasks, setTasks] = useState(emptyTasks);
  const [historyGroups, setHistoryGroups] = useState([]);
  // const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notice, setNotice] = useState(null);
  const [taskModalNotice, setTaskModalNotice] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
const [historyNotice, setHistoryNotice] = useState(null);
const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCarryModalOpen, setIsCarryModalOpen] = useState(false);
  const [showSecondaryTasks, setShowSecondaryTasks] = useState(false);
  const [isPrimaryRenaming, setIsPrimaryRenaming] = useState(false);
  const [primaryRenameValue, setPrimaryRenameValue] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const handleUnauthorized = () => {
    signOut();
    navigate("/login", {
      replace: true,
      state: { notice: "Your session expired. Please sign in again." }
    });
  };

  const loadTasks = async () => {
    try {
      const response = await fetchTodayTasks();
      const nextTasks = {
        primary: response.data.primary,
        secondary: response.data.secondary || []
      };

      setTasks(nextTasks);
      setPrimaryRenameValue(nextTasks.primary?.title || "");
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

const loadTaskHistory = async () => {
  setIsHistoryLoading(true);

  try {
    const response = await fetchTaskHistory();
    const groupedTasks = groupTasksByDate(response.data || []);
    setHistoryGroups(groupedTasks);
  } catch (error) {
    if (error.response?.status === 401) {
      handleUnauthorized();
      return;
    }

    setCarryNotice({
      type: "error",
      text: getErrorMessage(error)
    });
  } finally {
    setIsHistoryLoading(false);
  }
};

  useEffect(() => {
    loadTasks();
  }, []);

  const hasRunningTask = [tasks.primary, ...tasks.secondary].some(
    (task) => task?.status === "in-progress" && task.startedAt
  );

  useEffect(() => {
    if (!hasRunningTask) {
      return undefined;
    }

    setNow(Date.now());
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasRunningTask]);

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
      const response = await createTask(payload);

      setNotice({
        type: "success",
        text: response.data?.message || "Task created successfully"
      });
      setIsTaskModalOpen(false);
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
      request: () => updateTaskStatus(taskId, status),
      successMessage: "Task status updated"
    });

  const handleRenameTask = (taskId, renameValue) =>
    runMutation({
      request: () => renameTask(taskId, renameValue.trim()),
      successMessage: "Task renamed successfully"
    });

  const handleDeleteTask = (taskId) =>
    runMutation({
      request: () => deleteTask(taskId),
      successMessage: "Task deleted successfully"
    });
  const handleLogout = async () => {
    setIsLoggingOut(true);

    let logoutNotice = "Logged out successfully.";

    try {
      const response = await logoutUser();
      logoutNotice = response.data?.message || logoutNotice;
    } catch (error) {
      if (error.response?.status !== 401) {
        logoutNotice = `Signed out locally. ${getErrorMessage(error)}`;
      }
    } finally {
      signOut();
      navigate("/login", {
        replace: true,
        state: { notice: logoutNotice }
      });
    }
  };

  const openTaskModal = () => {
    setNotice(null);
    setTaskModalNotice(null);
    setIsTaskModalOpen(true);
  };

  const openHistoryModal = () => {
    setNotice(null);
    setHistoryNotice(null);
    setIsHistoryModalOpen(true);
    loadTaskHistory();
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
            <button
              className="ghost-button toolbar-action"
              disabled={isSubmitting || isLoggingOut}
              onClick={openTaskModal}
              type="button"
            >
              + Add Task
            </button>
            <button
              className="ghost-button toolbar-action"
              disabled={isSubmitting || isLoggingOut}
              onClick={openHistoryModal}
              type="button"
            >
              History
            </button>
            <button
              className="inline-button toolbar-logout"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        {notice ? (
          <p className={`notice ${notice.type === "error" ? "notice-error" : "notice-success"}`}>
            {notice.text}
          </p>
        ) : null}

        <section className="panel primary-focus-card">
          <p className="eyebrow">Today's Primary Task</p>

          {primaryTask ? (
            <>
              <h3 className="primary-title">{primaryTask.title}</h3>
              <p className="primary-status-line">Status: {getTaskStatusLabel(primaryTask.status)}</p>
              <TaskTimeSummary now={now} task={primaryTask} />

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
              <h3>No primary task for today</h3>
              <p>Create one focused task to anchor the rest of the day.</p>
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
            <span>Today's Secondary Tasks ({tasks.secondary.length})</span>
            <span aria-hidden="true">{showSecondaryTasks ? "^" : "v"}</span>
          </button>

          {showSecondaryTasks ? (
            tasks.secondary.length ? (
              <ul className="secondary-list">
                {tasks.secondary.map((task) => (
                  <SecondaryTaskRow
                    isSubmitting={isSubmitting}
                    key={task._id}
                    now={now}
                    onDelete={handleDeleteTask}
                    onRename={handleRenameTask}
                    onStatusChange={handleStatusChange}
                    task={task}
                  />
                ))}
              </ul>
            ) : (
              <p className="muted-copy">No secondary tasks for today.</p>
            )
          ) : (
            <p className="muted-copy">
              {unfinishedSecondaryCount > 0
                ? `${unfinishedSecondaryCount} unfinished secondary task${
                    unfinishedSecondaryCount === 1 ? "" : "s"
                  } waiting for attention today.`
                : "No unfinished secondary tasks for today."}
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

      {/* <CarryForwardModal
        feedback={carryNotice}
        historyGroups={historyGroups}
        isLoading={isHistoryLoading}
        isOpen={isCarryModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsCarryModalOpen(false)}
        onRetry={loadTaskHistory}
        onSubmit={handleCarryForward}
        onToggleSelect={toggleSelectedTask}
        selectedIds={selectedIds}
      /> */}


      <HistoryModal
        feedback={historyNotice}
        historyGroups={historyGroups}
        isLoading={isHistoryLoading}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onRetry={loadTaskHistory}
      />
    </main>
  );
}
