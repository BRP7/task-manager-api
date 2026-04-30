import { useEffect, useState } from "react";

const defaultMinutes = 30;

export default function TaskModal({
  feedback,
  hasPrimaryTask,
  isOpen,
  isSubmitting,
  onClose,
  onCreateTask
}) {
  const [form, setForm] = useState({
    title: "",
    type: hasPrimaryTask ? "secondary" : "primary",
    estimatedTime: defaultMinutes
  });
  const [typeWarning, setTypeWarning] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      title: "",
      type: hasPrimaryTask ? "secondary" : "primary",
      estimatedTime: defaultMinutes
    });
    setTypeWarning("");
  }, [hasPrimaryTask, isOpen]);

  if (!isOpen) {
    return null;
  }

  const requestClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "type") {
      if (hasPrimaryTask && value === "primary") {
        setTypeWarning("You already have a main task for today. Create a secondary task instead.");
        setForm((current) => ({ ...current, type: "secondary" }));
        return;
      }

      setTypeWarning("");
    }

    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onCreateTask({
      title: form.title.trim(),
      type: form.type,
      estimatedTime: Number(form.estimatedTime)
    });
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
            <p className="eyebrow">Add Task</p>
            <h2>Create a new task</h2>
          </div>
          <button className="inline-button" disabled={isSubmitting} onClick={requestClose} type="button">
            Close
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {feedback ? (
            <p className={`notice ${feedback.type === "error" ? "notice-error" : "notice-success"}`}>
              {feedback.text}
            </p>
          ) : null}

          <label>
            <span>Title</span>
            <input
              autoFocus
              name="title"
              onChange={handleChange}
              placeholder="Write release notes"
              required
              value={form.title}
            />
          </label>

          <div className="field-row">
            <label className="field-with-note">
              <span>Type</span>
              <select name="type" onChange={handleChange} value={form.type}>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
              {typeWarning ? (
                <p className="field-note field-note-warning">
                  {typeWarning}
                </p>
              ) : !hasPrimaryTask ? (
                <p className="field-note">Choose Primary for the one main task that leads your day.</p>
              ) : null}
            </label>

            <label>
              <span>Estimated Time</span>
              <input
                min="1"
                name="estimatedTime"
                onChange={handleChange}
                required
                type="number"
                value={form.estimatedTime}
              />
            </label>
          </div>

          {!hasPrimaryTask ? (
            <p className="muted-copy">Start with one main task before adding secondary work.</p>
          ) : null}

          <div className="modal-actions">
            <button className="inline-button" disabled={isSubmitting} onClick={requestClose} type="button">
              Cancel
            </button>
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
