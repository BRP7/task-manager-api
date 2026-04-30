function getTaskTypeLabel(type) {
  return type === "primary" ? "Primary" : "Secondary";
}

function getTaskStatusLabel(status) {
  if (status === "in-progress") {
    return "In progress";
  }

  return "To do";
}

export default function CarryForwardModal({
  feedback,
  isOpen,
  isSubmitting,
  onCarryAll,
  onCarrySelected,
  onClose,
  onToggleSelect,
  selectedIds,
  tasks
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
            <h2>Carry unfinished tasks to tomorrow</h2>
          </div>
          <button className="inline-button" disabled={isSubmitting} onClick={requestClose} type="button">
            Close
          </button>
        </div>

        {tasks.length ? (
          <>
            <ul className="carry-list">
              {tasks.map((task) => (
                <li className="carry-row" key={task._id}>
                  <label className="carry-select">
                    <input
                      checked={selectedIds.includes(task._id)}
                      disabled={isSubmitting}
                      onChange={() => onToggleSelect(task._id)}
                      type="checkbox"
                    />
                    <div>
                      <p className="carry-title">{task.title}</p>
                      <p className="carry-meta">
                        {getTaskTypeLabel(task.type)} . {task.estimatedTime} min .{" "}
                        {getTaskStatusLabel(task.status)}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>

            {feedback ? <p className="notice notice-error">{feedback.text}</p> : null}

            <div className="modal-actions">
              <button className="ghost-button" disabled={isSubmitting} onClick={onCarryAll} type="button">
                Carry All Tasks
              </button>
              <button
                className="primary-button"
                disabled={isSubmitting || selectedIds.length === 0}
                onClick={onCarrySelected}
                type="button"
              >
                Carry Selected
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted-copy">No unfinished tasks are available to carry forward.</p>
            <div className="modal-actions">
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
