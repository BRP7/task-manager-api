function getTaskTypeLabel(type) {
  return type === "primary" ? "Primary" : "Secondary";
}

function getTaskStatusLabel(status) {
  if (status === "in-progress") {
    return "In progress";
  }

  if (status === "done") {
    return "Done";
  }

  return "To do";
}

function HistoryTaskRow({ isSelected, isSubmitting, onToggleSelect, task }) {
  const isDone = task.status === "done";

  return (
    <li className="carry-row" key={task._id}>
      <label className={`carry-select ${isDone ? "carry-select-disabled" : ""}`}>
        <input
          checked={isSelected}
          disabled={isDone || isSubmitting}
          onChange={() => onToggleSelect(task._id)}
          type="checkbox"
        />
        <div>
          <p className="carry-title">{task.title}</p>
          <p className="carry-meta">
            {getTaskTypeLabel(task.type)} . {task.estimatedTime} min .{" "}
            {getTaskStatusLabel(task.status)}
          </p>
          {isDone ? <p className="carry-note">Completed tasks cannot be carried forward.</p> : null}
        </div>
      </label>
    </li>
  );
}

export default function CarryForwardModal({
  feedback,
  historyGroups,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onRetry,
  onSubmit,
  onToggleSelect,
  selectedIds
}) {
  if (!isOpen) {
    return null;
  }

  const requestClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={requestClose} role="presentation">
      <section
        aria-modal="true"
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Carry Forward</p>
            <h2>Pick tasks from the last 7 days</h2>
          </div>
          <button className="inline-button" disabled={isSubmitting} onClick={requestClose} type="button">
            Close
          </button>
        </div>

        {feedback ? (
          <p className={`notice ${feedback.type === "error" ? "notice-error" : "notice-success"}`}>
            {feedback.text}
          </p>
        ) : null}

        {isLoading ? (
          <p className="muted-copy">Loading recent task history...</p>
        ) : historyGroups.length ? (
          <>
            <div className="history-groups">
              {historyGroups.map((group) => (
                <section className="history-group" key={group.date}>
                  <div className="history-group-header">
                    <h3>{group.label}</h3>
                    <span>{group.tasks.length} task{group.tasks.length === 1 ? "" : "s"}</span>
                  </div>

                  <ul className="carry-list">
                    {group.tasks.map((task) => (
                      <HistoryTaskRow
                        isSelected={selectedIds.includes(task._id)}
                        isSubmitting={isSubmitting}
                        key={task._id}
                        onToggleSelect={onToggleSelect}
                        task={task}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <p className="selection-note">
              {selectedIds.length > 0
                ? `${selectedIds.length} task${selectedIds.length === 1 ? "" : "s"} selected`
                : "Select at least one unfinished task to carry it forward."}
            </p>

            <div className="modal-actions">
              <button className="ghost-button" disabled={isSubmitting} onClick={onRetry} type="button">
                Refresh
              </button>
              <button
                className="primary-button"
                disabled={isSubmitting || selectedIds.length === 0}
                onClick={onSubmit}
                type="button"
              >
                Carry Forward
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted-copy">No tasks were found in the last 7 days.</p>
            <div className="modal-actions">
              <button className="ghost-button" disabled={isSubmitting} onClick={onRetry} type="button">
                Refresh
              </button>
              <button className="inline-button" onClick={requestClose} type="button">
                Close
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
